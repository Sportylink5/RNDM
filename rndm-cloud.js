// RNDM Chat v24.1 — fast Supabase cloud connection
// Browser-safe: publishable key only. Never put sb_secret/service_role here.
window.RNDM_SUPABASE_URL = 'https://rijqlmrcnshswtoweoai.supabase.co';
window.RNDM_SUPABASE_KEY = 'sb_publishable_Ay6EBRfZx1-Shj1FdMg7ZQ_P61Rii2A';

window.RNDMCloud = (() => {
  let client = null;
  let sessionPromise = null;
  let cachedSession = undefined;
  const profileCache = new Map();
  const profilePromises = new Map();
  const PROFILE_TTL = 30000;

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
      client.auth.onAuthStateChange((_event,session)=>{
        cachedSession = session || null;
        sessionPromise = null;
        if(!session) profileCache.clear();
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

  async function profile(uid,force=false){
    const c=getClient(); if(!c||!uid) return null;
    const hit=profileCache.get(uid);
    if(!force && hit && (Date.now()-hit.at)<PROFILE_TTL) return hit.data;
    if(!force && profilePromises.has(uid)) return profilePromises.get(uid);
    const p=c.from('profiles').select('*').eq('id',uid).maybeSingle().then(({data,error})=>{
      profilePromises.delete(uid);
      if(error) return null;
      profileCache.set(uid,{data:data||null,at:Date.now()});
      return data||null;
    }).catch(()=>{profilePromises.delete(uid);return null});
    profilePromises.set(uid,p);
    return p;
  }

  function invalidateProfile(uid){ if(uid) profileCache.delete(uid); else profileCache.clear(); }
  async function myProfile(force=false){ const u=await user(); return u ? profile(u.id,force) : null; }

  function esc(s=''){
    return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  }

  function time(ts){
    if(!ts)return '';
    const d=new Date(ts), n=new Date();
    if(d.toDateString()===n.toDateString()) return d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  }

  async function heartbeat(){
    const c=getClient(), u=await user(); if(!c||!u)return;
    // Do not await this from page startup; callers can fire-and-forget.
    await c.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',u.id);
  }

  async function stateGet(key){
    const c=getClient(),u=await user(); if(!c||!u)return null;
    const {data,error}=await c.from('user_state').select('value,updated_at').eq('user_id',u.id).eq('key',key).maybeSingle();
    if(error) return null;
    return data||null;
  }

  async function stateSet(key,value){
    const c=getClient(),u=await user(); if(!c||!u)return false;
    const {error}=await c.from('user_state').upsert({user_id:u.id,key,value,updated_at:new Date().toISOString()},{onConflict:'user_id,key'});
    return !error;
  }

  async function upload(bucket,file,prefix='files',maxBytes=100*1024*1024){
    const c=getClient(),u=await user();
    if(!c||!u) throw new Error('Нужно войти в аккаунт');
    if(!file) throw new Error('Файл не выбран');
    if(file.size>maxBytes) throw new Error('Файл слишком большой');
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
      callback?.(event,s);
    });
    return data?.subscription||{unsubscribe(){}};
  }

  return {configured,getClient,user,validateUser,session,profile,myProfile,invalidateProfile,esc,time,heartbeat,stateGet,stateSet,upload,onAuth};
})();
