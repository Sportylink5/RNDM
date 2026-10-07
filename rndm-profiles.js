// RNDM v26.5 public profile navigation helpers
(()=>{
  const C=window.RNDMCloud;
  function url(id,username){return 'profile.html?'+(id?'id='+encodeURIComponent(id):'u='+encodeURIComponent(String(username||'').replace(/^@/,'')))}
  function open(id,username){location.href=url(id,username)}
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-profile-id],[data-user-id]'); if(!el)return;
    if(e.target.closest('button,input,textarea,select') && !e.target.closest('[data-profile-open]'))return;
    const id=el.dataset.profileId||el.dataset.userId; if(!id)return;
    if(el.tagName==='A')return;
    e.preventDefault(); open(id,el.dataset.username);
  });
  window.RNDMProfiles={url,open};
})();
