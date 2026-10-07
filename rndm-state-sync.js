// RNDM v26.3 — FAST cloud state sync with longer cross-page cache.
// One SELECT + at most one UPSERT instead of dozens of sequential requests.
(()=>{
  const KEYS = [
    'rndm-theme','rndm-stars-v1','rndm-star-log-v1','rndm-xp-v1','rndm-xp-v13',
    'rndm-notepad-v1','rndm-gifts-v1','rndm-settings-v2','rndm-roulette-history',
    'rndmCatV2','rndmStarsV1','rndm-cat-taps','rndm-chat-theme-v13','rndm-user-status-v13',
    'rndm-v15-progress','rndm-v15-daily','rndm-v15-notifications','rndm-v15-achievements',
    'rndm-v15-saved-clips','rndm-v15-following','rndm-v15-collectibles','rndm-v15-showcase',
    'rndm-game-reaction-best','rndm-game-rps-wins','rndm-paint-draft'
  ];
  let ready=false, pulling=false;
  const timers=new Map();
  const pending=new Map();
  let flushTimer=null;
  const originalSet=Storage.prototype.setItem;
  const CACHE_KEY='rndm-state-cache-v263';
  const CACHE_TTL=300000;

  function getCache(uid){
    try{
      const x=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
      if(x && x.user_id===uid && (Date.now()-Number(x.at||0))<CACHE_TTL && Array.isArray(x.rows)) return x;
    }catch(e){}
    return null;
  }
  function putCache(uid,rows){
    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({user_id:uid,at:Date.now(),rows:rows||[]}))}catch(e){}
  }

  function decode(raw){
    if(raw===null||raw===undefined) return null;
    try{return JSON.parse(raw)}catch{return {__raw:String(raw)}}
  }
  function encode(value){
    if(value && typeof value==='object' && Object.prototype.hasOwnProperty.call(value,'__raw')) return String(value.__raw);
    return JSON.stringify(value);
  }

  async function flush(){
    flushTimer=null;
    if(!ready||pulling||!pending.size||!window.RNDMCloud?.configured?.()) return;
    const batch=[...pending.entries()]; pending.clear();
    try{
      const sb=RNDMCloud.getClient(),u=await RNDMCloud.user(); if(!sb||!u)return;
      const now=new Date().toISOString();
      const rows=batch.map(([key,value])=>({user_id:u.id,key:'ls:'+key,value,updated_at:now}));
      const {error}=await sb.from('user_state').upsert(rows,{onConflict:'user_id,key'});
      if(!error){
        const cached=getCache(u.id);
        if(cached){
          const m=new Map(cached.rows.map(r=>[r.key,r])); rows.forEach(r=>m.set(r.key,r)); putCache(u.id,[...m.values()]);
        }
      }
    }catch(e){}
  }

  function queuePush(key,raw){
    if(!ready||pulling||!KEYS.includes(key)||!window.RNDMCloud?.configured?.()) return;
    pending.set(key,decode(raw));
    clearTimeout(flushTimer);
    flushTimer=setTimeout(flush,650);
  }

  Storage.prototype.setItem=function(key,value){
    originalSet.call(this,key,value);
    if(this===localStorage) queuePush(String(key),String(value));
  };

  async function init(){
    try{
      if(!window.RNDMCloud?.configured?.()) return;
      const sb=RNDMCloud.getClient(),u=await RNDMCloud.user(); if(!sb||!u){ready=true;return}
      pulling=true;
      const cloudKeys=KEYS.map(k=>'ls:'+k);
      let data=null;
      const cached=getCache(u.id);
      if(cached){
        data=cached.rows;
      }else{
        const res=await sb.from('user_state').select('key,value,updated_at').eq('user_id',u.id).in('key',cloudKeys);
        if(res.error) throw res.error;
        data=res.data||[];
        putCache(u.id,data);
      }
      const map=new Map((data||[]).map(r=>[String(r.key).slice(3),r.value]));
      const missing=[];
      const now=new Date().toISOString();
      for(const key of KEYS){
        if(map.has(key)){
          originalSet.call(localStorage,key,encode(map.get(key)));
        }else{
          const local=localStorage.getItem(key);
          if(local!==null) missing.push({user_id:u.id,key:'ls:'+key,value:decode(local),updated_at:now});
        }
      }
      if(missing.length){
        const {error}=await sb.from('user_state').upsert(missing,{onConflict:'user_id,key'});
        if(!error){
          const merged=new Map((data||[]).map(r=>[r.key,r])); missing.forEach(r=>merged.set(r.key,r)); putCache(u.id,[...merged.values()]);
        }
      }
      pulling=false; ready=true;
      document.dispatchEvent(new CustomEvent('rndm-cloud-state-ready'));
    }catch(e){
      pulling=false; ready=true;
      console.warn('RNDM cloud state sync:',e?.message||e);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,20)); else setTimeout(init,20);
})();
