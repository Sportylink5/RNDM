// RNDM v22 — syncs selected local progress/settings to Supabase user_state.
// Social content (messages/clips/channels/videos/market) uses normalized cloud tables separately.
(()=>{
  const KEYS = [
    'rndm-theme','rndm-stars-v1','rndm-star-log-v1','rndm-xp-v1','rndm-xp-v13',
    'rndm-notepad-v1','rndm-gifts-v1','rndm-settings-v2','rndm-roulette-history',
    'rndmCatV2','rndmStarsV1','rndm-cat-taps','rndm-chat-theme-v13','rndm-user-status-v13',
    'rndm-v15-progress','rndm-v15-daily','rndm-v15-notifications','rndm-v15-achievements',
    'rndm-v15-saved-clips','rndm-v15-following','rndm-v15-collectibles','rndm-v15-showcase',
    'rndm-game-reaction-best','rndm-game-rps-wins','rndm-paint-draft'
  ];
  let ready=false, pulling=false, timers=new Map();
  const originalSet=Storage.prototype.setItem;

  function decode(raw){
    if(raw===null||raw===undefined) return null;
    try{return JSON.parse(raw)}catch{return {__raw:String(raw)}}
  }
  function encode(value){
    if(value && typeof value==='object' && Object.prototype.hasOwnProperty.call(value,'__raw')) return String(value.__raw);
    return JSON.stringify(value);
  }
  async function push(key,raw){
    if(!ready||pulling||!KEYS.includes(key)||!window.RNDMCloud?.configured?.()) return;
    const old=timers.get(key); if(old) clearTimeout(old);
    timers.set(key,setTimeout(async()=>{try{await RNDMCloud.stateSet('ls:'+key,decode(raw))}catch(e){}},500));
  }

  Storage.prototype.setItem=function(key,value){
    originalSet.call(this,key,value);
    if(this===localStorage) push(String(key),String(value));
  };

  async function init(){
    try{
      if(!window.RNDMCloud?.configured?.()) return;
      const u=await RNDMCloud.user(); if(!u) return;
      pulling=true;
      for(const key of KEYS){
        const cloud=await RNDMCloud.stateGet('ls:'+key);
        const local=localStorage.getItem(key);
        if(cloud?.value!==undefined && cloud?.value!==null){
          originalSet.call(localStorage,key,encode(cloud.value));
        }else if(local!==null){
          await RNDMCloud.stateSet('ls:'+key,decode(local));
        }
      }
      pulling=false; ready=true;
      document.dispatchEvent(new CustomEvent('rndm-cloud-state-ready'));
    }catch(e){pulling=false;ready=true;}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,50)); else setTimeout(init,50);
})();
