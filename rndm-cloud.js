// RNDM Chat v22 — Supabase cloud connection
// Safe for browser: use ONLY Publishable/anon key here. Never use sb_secret/service_role.
window.RNDM_SUPABASE_URL = 'https://rijqlmrcnshswtoweoai.supabase.co';
window.RNDM_SUPABASE_KEY = 'sb_publishable_Ay6EBRfZx1-Shj1FdMg7ZQ_P61Rii2A';

window.RNDMCloud = (() => {
  let client = null;
  const configured = () => /^https:\/\/.+\.supabase\.co$/i.test(window.RNDM_SUPABASE_URL || '') &&
    !!window.RNDM_SUPABASE_KEY && !String(window.RNDM_SUPABASE_KEY).includes('PASTE_');

  function getClient(){
    if(!configured()) return null;
    if(!client){
      if(!window.supabase?.createClient) throw new Error('Supabase library not loaded');
      client = window.supabase.createClient(window.RNDM_SUPABASE_URL, window.RNDM_SUPABASE_KEY, {
        auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}
      });
    }
    return client;
  }

  async function user(){
    const c=getClient(); if(!c) return null;
    const {data,error}=await c.auth.getUser();
    if(error) return null;
    return data?.user||null;
  }

  async function session(){
    const c=getClient(); if(!c) return null;
    const {data}=await c.auth.getSession();
    return data?.session||null;
  }

  async function profile(uid){
    const c=getClient(); if(!c||!uid) return null;
    const {data}=await c.from('profiles').select('*').eq('id',uid).maybeSingle();
    return data||null;
  }

  async function myProfile(){ const u=await user(); return u ? profile(u.id) : null; }

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
    const {data}=c.auth.onAuthStateChange((event,session)=>callback?.(event,session));
    return data?.subscription||{unsubscribe(){}};
  }

  return {configured,getClient,user,session,profile,myProfile,esc,time,heartbeat,stateGet,stateSet,upload,onAuth};
})();
