// RNDM Chat v18 — Supabase cloud connection
// 1) Create a Supabase project.
// 2) Run supabase_schema.sql in SQL Editor.
// 3) Paste Project URL and Publishable/anon key below.
window.RNDM_SUPABASE_URL = 'https://rijqlmrcnshswtoweoai.supabase.co';
window.RNDM_SUPABASE_KEY = 'sb_publishable_Ay6EBRfZx1-Shj1FdMg7ZQ_P61Rii2A';

window.RNDMCloud = (() => {
  let client = null;
  const configured = () => /^https:\/\/.+\.supabase\.co$/i.test(window.RNDM_SUPABASE_URL || '') &&
    window.RNDM_SUPABASE_KEY && !window.RNDM_SUPABASE_KEY.includes('PASTE_');
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
    const {data}=await c.auth.getUser(); return data?.user||null;
  }
  async function profile(uid){
    const c=getClient(); if(!c||!uid) return null;
    const {data}=await c.from('profiles').select('*').eq('id',uid).maybeSingle(); return data||null;
  }
  function esc(s=''){ return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m])); }
  function time(ts){
    if(!ts)return ''; const d=new Date(ts), n=new Date();
    if(d.toDateString()===n.toDateString()) return d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  }
  async function heartbeat(){
    const c=getClient(); const u=await user(); if(!c||!u)return;
    await c.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',u.id);
  }
  return {configured,getClient,user,profile,esc,time,heartbeat};
})();
