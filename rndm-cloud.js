// RNDM Chat v26.5 PROFILES — cached bootstrap + recovery + avatars
// Browser-safe: publishable key only. Never put sb_secret/service_role here.
window.RNDM_SUPABASE_URL = 'https://rijqlmrcnshswtoweoai.supabase.co';
window.RNDM_SUPABASE_KEY = 'sb_publishable_Ay6EBRfZx1-Shj1FdMg7ZQ_P61Rii2A';

window.RNDMCloud = (() => {
  let client = null;
  let sessionPromise = null;
  let cachedSession = undefined;
  const profileCache = new Map();
  const profilePromises = new Map();
  const PROFILE_TTL = 600000;
  const HEARTBEAT_TTL = 300000;
  let heartbeatPromise = null;
  let bootstrapPromise = null;
  let bootstrapMemory = null;
  const BOOTSTRAP_TTL = 120000;
  const STATE_TTL = 300000;

  const configured = () => /^https:\/\/.+\.supabase\.co$/i.test(window.RNDM_SUPABASE_URL || '') &&
    !!window.RNDM_SUPABASE_KEY && !String(window.RNDM_SUPABASE_KEY).includes('PASTE_');

  function getClient(){
    if(!configured()) return null;
    if(!client){
      if(!window.supabase?.createClient) throw new Error('Supabase library not loaded');
      client = window.supabase.createClient(window.RNDM_SUPABASE_URL, window.RNDM_SUPABASE_KEY, {
        auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true},
        realtime:{params:{eventsPerSecond:10}}
      });
      client.auth.onAuthStateChange((event,session)=>{
        cachedSession = session || null;
        sessionPromise = null;
        bootstrapMemory = null; bootstrapPromise = null;
        if(!session) profileCache.clear();
        if(event==='PASSWORD_RECOVERY'){
          try{sessionStorage.setItem('rndm-password-recovery','1')}catch{}
          const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
          if(page!=='profile.html'&&page!=='reset-password.html'){location.replace('reset-password.html')}
        }
      });
    }
    return client;
  }

  // getSession reads the locally persisted session first and is much faster than
  // auth.getUser(), which performs a network validation request every call.
  async function session(force=false){
    const c=getClient(); if(!c) return null;
    if(!force && cachedSession !== undefined) return cachedSession;
    if(!force && sessionPromise) return sessionPromise;
    sessionPromise = c.auth.getSession().then(({data})=>{
      cachedSession = data?.session || null;
      sessionPromise = null;
      return cachedSession;
    }).catch(()=>{sessionPromise=null;return null});
    return sessionPromise;
  }

  async function user(){
    const s=await session();
    return s?.user || null;
  }

  async function validateUser(){
    const c=getClient(); if(!c) return null;
    const {data,error}=await c.auth.getUser();
    if(error) return null;
    return data?.user || null;
  }

  function bootstrapStorageKey(uid){ return 'rndm-bootstrap-v264:'+uid; }
  function readBootstrapStored(uid){
    try{
      const x=JSON.parse(sessionStorage.getItem(bootstrapStorageKey(uid))||'null');
      if(x && (Date.now()-Number(x.at||0))<BOOTSTRAP_TTL) return x;
    }catch{}
    return null;
  }
  function writeBootstrapStored(uid,data){
    try{sessionStorage.setItem(bootstrapStorageKey(uid),JSON.stringify({at:Date.now(),data:data||null}))}catch{}
  }
  async function bootstrap(force=false){
    const c=getClient(); if(!c) return null;
    const s=await session(); const uid=s?.user?.id; if(!uid) return null;
    if(!force && bootstrapMemory && bootstrapMemory.uid===uid && (Date.now()-bootstrapMemory.at)<BOOTSTRAP_TTL) return bootstrapMemory.data;
    if(!force){
      const st=readBootstrapStored(uid);
      if(st){bootstrapMemory={uid,at:st.at,data:st.data}; if(st.data?.profile){const row={data:st.data.profile,at:Date.now()};profileCache.set(uid,row);writeStoredProfile(uid,row.data)} return st.data;}
    }
    if(!force && bootstrapPromise) return bootstrapPromise;
    bootstrapPromise=c.rpc('rndm_bootstrap').then(({data,error})=>{
      bootstrapPromise=null;
      if(error) return null;
      bootstrapMemory={uid,at:Date.now(),data:data||null}; writeBootstrapStored(uid,data||null);
      if(data?.profile){const row={data:data.profile,at:Date.now()};profileCache.set(uid,row);writeStoredProfile(uid,row.data)}
      return data||null;
    }).catch(()=>{bootstrapPromise=null;return null});
    return bootstrapPromise;
  }

  function profileStorageKey(uid){ return 'rndm-profile-cache-v251:'+uid; }
  function readStoredProfile(uid){
    try{
      const x=JSON.parse(sessionStorage.getItem(profileStorageKey(uid))||'null');
      if(x && (Date.now()-Number(x.at||0))<PROFILE_TTL) return x;
    }catch(e){}
    return null;
  }
  function writeStoredProfile(uid,data){
    try{ sessionStorage.setItem(profileStorageKey(uid),JSON.stringify({data:data||null,at:Date.now()})); }catch(e){}
  }

  async function profile(uid,force=false){
    const c=getClient(); if(!c||!uid) return null;
    const hit=profileCache.get(uid);
    if(!force && hit && (Date.now()-hit.at)<PROFILE_TTL) return hit.data;
    if(!force){
      const stored=readStoredProfile(uid);
      if(stored){ profileCache.set(uid,stored); return stored.data; }
    }
    if(!force){const ss=await session();if(ss?.user?.id===uid){const b=await bootstrap(false);if(b?.profile)return b.profile;}}
    if(!force && profilePromises.has(uid)) return profilePromises.get(uid);
    const p=c.from('profiles').select('*').eq('id',uid).maybeSingle().then(({data,error})=>{
      profilePromises.delete(uid);
      if(error) return null;
      const row={data:data||null,at:Date.now()};
      profileCache.set(uid,row); writeStoredProfile(uid,row.data);
      return data||null;
    }).catch(()=>{profilePromises.delete(uid);return null});
    profilePromises.set(uid,p);
    return p;
  }

  function invalidateProfile(uid){
    if(uid){
      profileCache.delete(uid);
      try{sessionStorage.removeItem(profileStorageKey(uid));sessionStorage.removeItem(bootstrapStorageKey(uid))}catch(e){}
      if(bootstrapMemory?.uid===uid)bootstrapMemory=null;
    }else{
      profileCache.clear();
      try{Object.keys(sessionStorage).filter(k=>k.startsWith('rndm-profile-cache-v251:')||k.startsWith('rndm-bootstrap-v264:')).forEach(k=>sessionStorage.removeItem(k))}catch(e){}
      bootstrapMemory=null;
    }
  }
  async function myProfile(force=false){ const u=await user(); return u ? profile(u.id,force) : null; }

  async function publicProfile(uid){
    const c=getClient(); if(!c||!uid) return null;
    const {data,error}=await c.rpc('get_public_profile',{p_user_id:uid});
    return error?null:(data||null);
  }
  async function publicProfileByUsername(username){
    const c=getClient(); if(!c||!username) return null;
    const {data,error}=await c.rpc('get_public_profile_by_username',{p_username:String(username).replace(/^@/,'')});
    return error?null:(data||null);
  }

  function esc(s=''){
    return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  }

  function time(ts){
    if(!ts)return '';
    const d=new Date(ts), n=new Date();
    if(d.toDateString()===n.toDateString()) return d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  }

  async function heartbeat(force=false){
    const c=getClient(), u=await user(); if(!c||!u)return false;
    const k='rndm-heartbeat-v251:'+u.id;
    let last=0; try{last=Number(localStorage.getItem(k)||0)}catch(e){}
    if(!force && Date.now()-last<HEARTBEAT_TTL) return true;
    if(heartbeatPromise) return heartbeatPromise;
    heartbeatPromise=(async()=>{
      const now=new Date().toISOString();
      const {error}=await c.from('profiles').update({last_seen:now}).eq('id',u.id);
      if(!error){
        try{localStorage.setItem(k,String(Date.now()))}catch(e){}
        const hit=profileCache.get(u.id);
        if(hit?.data){ hit.data={...hit.data,last_seen:now}; hit.at=Date.now(); writeStoredProfile(u.id,hit.data); }
      }
      heartbeatPromise=null;
      return !error;
    })().catch(()=>{heartbeatPromise=null;return false});
    return heartbeatPromise;
  }

  function stateCacheKey(uid,key){return 'rndm-state-v263:'+uid+':'+key}
  function stateCacheRead(uid,key){try{const x=JSON.parse(sessionStorage.getItem(stateCacheKey(uid,key))||'null');if(x&&(Date.now()-Number(x.at||0))<STATE_TTL)return x.data}catch{}return null}
  function stateCacheWrite(uid,key,data){try{sessionStorage.setItem(stateCacheKey(uid,key),JSON.stringify({at:Date.now(),data:data||null}))}catch{}}

  async function stateGet(key){
    const c=getClient(),u=await user(); if(!c||!u)return null;
    const hit=stateCacheRead(u.id,key); if(hit)return hit;
    const {data,error}=await c.from('user_state').select('value,updated_at').eq('user_id',u.id).eq('key',key).maybeSingle();
    if(error) return null;
    stateCacheWrite(u.id,key,data||null);
    return data||null;
  }

  async function stateSet(key,value){
    const c=getClient(),u=await user(); if(!c||!u)return false;
    const row={user_id:u.id,key,value,updated_at:new Date().toISOString()};
    const {error}=await c.from('user_state').upsert(row,{onConflict:'user_id,key'});
    if(!error)stateCacheWrite(u.id,key,{value,updated_at:row.updated_at});
    return !error;
  }


  function avatarPathFromUrl(url){
    try{
      if(!url) return null;
      const marker='/storage/v1/object/public/avatars/';
      const u=new URL(url,location.href);
      const i=u.pathname.indexOf(marker);
      if(i<0) return null;
      return decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(e){ return null; }
  }

  async function uploadAvatar(file){
    const c=getClient(),u=await user();
    if(!c||!u) throw new Error('Нужно войти в аккаунт');
    if(!file) throw new Error('Фото не выбрано');
    const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
    if(!allowed.has(String(file.type||'').toLowerCase())) throw new Error('Поддерживаются JPG, PNG, WebP, GIF и AVIF');
    if(file.size>5*1024*1024) throw new Error('Аватар должен быть не больше 5 МБ');
    const ext=({
      'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'
    })[file.type]||'jpg';
    const path=`${u.id}/avatar-${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const {error}=await c.storage.from('avatars').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
    if(error) throw error;
    const {data}=c.storage.from('avatars').getPublicUrl(path);
    return {path,url:data.publicUrl+'?v='+Date.now()};
  }

  async function deleteOwnAvatar(url){
    const c=getClient(),u=await user();
    if(!c||!u||!url) return true;
    const path=avatarPathFromUrl(url);
    if(!path || !path.startsWith(u.id+'/')) return true;
    const {error}=await c.storage.from('avatars').remove([path]);
    return !error;
  }


  async function uploadProfileImage(file,kind='cover'){
    const c=getClient(),u=await user();
    if(!c||!u) throw new Error('Нужно войти в аккаунт');
    if(!file) throw new Error('Изображение не выбрано');
    const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);
    if(!allowed.has(String(file.type||'').toLowerCase())) throw new Error('Поддерживаются JPG, PNG, WebP, GIF и AVIF');
    if(file.size>5*1024*1024) throw new Error('Изображение должно быть не больше 5 МБ');
    const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'})[file.type]||'jpg';
    const safeKind=String(kind||'image').replace(/[^a-z0-9_-]/gi,'').slice(0,20)||'image';
    const path=`${u.id}/${safeKind}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const {error}=await c.storage.from('avatars').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
    if(error) throw error;
    const {data}=c.storage.from('avatars').getPublicUrl(path);
    return {path,url:data.publicUrl+'?v='+Date.now()};
  }

  async function deleteOwnProfileImage(url){
    return deleteOwnAvatar(url);
  }


  async function optimizeUploadImage(file){
    try{
      const type=String(file?.type||'').toLowerCase();
      if(!['image/jpeg','image/png','image/webp'].includes(type)||file.size<700*1024)return file;
      const bmp=await createImageBitmap(file);const max=1600,scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
      if(scale>=.99)return file;const c=document.createElement('canvas');c.width=Math.round(bmp.width*scale);c.height=Math.round(bmp.height*scale);
      c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);bmp.close?.();
      const outType=type==='image/png'?'image/webp':type;const blob=await new Promise(r=>c.toBlob(r,outType,.84));
      if(!blob||blob.size>=file.size)return file;const ext=outType==='image/webp'?'.webp':outType==='image/jpeg'?'.jpg':'.png';
      return new File([blob],String(file.name||'image').replace(/\.[^.]+$/, '')+ext,{type:outType,lastModified:Date.now()});
    }catch{return file}
  }

  async function upload(bucket,file,prefix='files',maxBytes=100*1024*1024){
    const c=getClient(),u=await user();
    if(!c||!u) throw new Error('Нужно войти в аккаунт');
    if(!file) throw new Error('Файл не выбран');
    if(file.size>maxBytes) throw new Error('Файл слишком большой');
    file=await optimizeUploadImage(file);
    const safe=String(file.name||'file').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-120);
    const path=`${u.id}/${prefix}/${crypto.randomUUID()}-${safe}`;
    const {error}=await c.storage.from(bucket).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
    if(error) throw error;
    const {data}=c.storage.from(bucket).getPublicUrl(path);
    return {path,url:data.publicUrl,name:file.name,type:file.type,size:file.size};
  }

  function onAuth(callback){
    const c=getClient(); if(!c) return {unsubscribe(){}};
    const {data}=c.auth.onAuthStateChange((event,s)=>{
      cachedSession=s||null;
      sessionPromise=null;
      if(!s)profileCache.clear();
      bootstrapMemory=null;bootstrapPromise=null;
      if(event==='PASSWORD_RECOVERY'){try{sessionStorage.setItem('rndm-password-recovery','1')}catch{};if(!['profile.html','reset-password.html'].includes((location.pathname.split('/').pop()||'').toLowerCase()))location.replace('reset-password.html')}
      callback?.(event,s);
    });
    return data?.subscription||{unsubscribe(){}};
  }

  return {configured,getClient,user,validateUser,session,bootstrap,profile,myProfile,publicProfile,publicProfileByUsername,invalidateProfile,esc,time,heartbeat,stateGet,stateSet,upload,uploadAvatar,deleteOwnAvatar,uploadProfileImage,deleteOwnProfileImage,onAuth};
})();
