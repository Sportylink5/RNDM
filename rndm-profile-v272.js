(()=>{
  const C=window.RNDMCloud;if(!C?.configured?.())return;const sb=C.getClient();
  const $=s=>document.querySelector(s), esc=C.esc||((s='')=>String(s));
  const set=(sel,val)=>{const e=$(sel);if(e)e.textContent=val??''};
  const html=(sel,val)=>{const e=$(sel);if(e)e.innerHTML=val??''};
  const show=(sel,on=true)=>{const e=$(sel);if(e)e.style.display=on?'block':'none'};
  const avatarHtml=p=>p?.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc((p?.display_name||p?.username||'?')[0]?.toUpperCase()||'?');

  async function bundle(){
    const ps=new URLSearchParams(location.search);const id=ps.get('id');const u=ps.get('u')||ps.get('user');
    const {data,error}=await sb.rpc('profile_page_bundle',{p_user_id:id||null,p_username:u||null});
    if(error)throw error;return data||null;
  }
  function badges(p){return `${p.app_role==='owner'?'<span class="v24-badge owner">👑 Owner</span>':p.app_role==='admin'?'<span class="v24-badge admin">🛡️ Admin</span>':p.app_role==='moderator'?'<span class="v24-badge mod">🔧 Moderator</span>':''}${p.is_verified?'<span class="v24-badge ok">✓ Verified</span>':''}${p.is_premium?'<span class="v24-badge">⭐ Premium</span>':''}${p.reputation!=null?`<span class="v24-badge">🤝 ${Number(p.reputation||0)}</span>`:''}${p.xp!=null?`<span class="v24-badge">🏆 XP ${Number(p.xp||0)}</span>`:''}`}
  function cover(el,p){if(!el)return;el.style.backgroundImage=p?.cover_url?`linear-gradient(180deg,transparent,#080b1466),url("${String(p.cover_url).replace(/"/g,'')}")`:'linear-gradient(135deg,#7b61ff,#2dd4bf)';el.style.backgroundSize='cover';el.style.backgroundPosition='center'}

  async function renderPublic(b){const p=b.profile;show('#authBox',false);show('#profileBox',false);show('#publicProfileBox',true);document.body.classList.add('rndm-public-profile');
    if(!p){const box=$('#publicProfileBox');box.innerHTML='<div class="profile-card"><h1>Профиль не найден</h1><p class="muted">Пользователь не существует, заблокирован или профиль недоступен.</p><a class="btn secondary" href="friends.html">Назад</a></div>';return}
    set('#publicName',p.display_name||p.username||'Пользователь');set('#publicUsername','@'+(p.username||''));set('#publicBio',p.bio|| (p.private_view?'🔒 Закрытый профиль':'Пользователь пока ничего о себе не рассказал.'));
    html('#publicAvatar',avatarHtml(p));cover($('#publicCover'),p);set('#publicStatus',p.last_seen&&Date.now()-new Date(p.last_seen).getTime()<90000?'● в сети':p.private_view?'🔒 Закрытый профиль':(p.status==='busy'?'Не беспокоить':'Пользователь RNDM'));html('#publicBadges',badges(p));
    document.querySelector('[data-v272-social]')?.remove();const social=b.social||{};const rel=b.relationship||{};const extra=document.createElement('div');extra.dataset.v272Social='1';extra.className='v27-card';extra.style.marginTop='14px';extra.innerHTML=`<div class="v27-stat-grid"><div class="v27-stat"><b>${social.followers||0}</b><span>подписчиков</span></div><div class="v27-stat"><b>${social.following||0}</b><span>подписок</span></div><div class="v27-stat"><b>${social.friends||0}</b><span>друзей</span></div><div class="v27-stat"><b>${social.clips||0}</b><span>Clips</span></div><div class="v27-stat"><b>${social.mutual_friends||0}</b><span>общих</span></div></div>${p.private_view?'<div class="v27-private" style="margin-top:12px">🔒 Подробности этого профиля доступны только друзьям.</div>':''}<div class="v27-row" style="margin-top:12px"><button class="v27-btn primary" id="v272Follow">${rel.following?'✓ Вы подписаны':rel.follow_request==='pending'?'⏳ Запрос отправлен':'＋ Подписаться'}</button><button class="v27-btn" id="v272Block">${rel.blocked_by_me?'Разблокировать':'🚫 Заблокировать'}</button></div>`;$('#publicProfileBox .profile-card')?.appendChild(extra);
    const msg=$('#publicMessage'),fr=$('#publicFriend');if(!b.authenticated){if(msg)msg.onclick=()=>location.href='profile.html';if(fr)fr.onclick=()=>location.href='profile.html';extra.style.display='none';return}
    let friendship=rel.friendship||'none';if(fr){fr.textContent=friendship==='accepted'?'✓ В друзьях':friendship==='pending'?'⏳ Заявка отправлена':'＋ Добавить в друзья';fr.disabled=friendship!=='none';fr.onclick=async()=>{const {error}=await sb.rpc('send_friend_request',{other:p.id});if(error)return alert(error.message);friendship='pending';fr.textContent='⏳ Заявка отправлена';fr.disabled=true}}
    if(msg)msg.onclick=async()=>{const {data,error}=await sb.rpc('get_or_create_direct',{other:p.id});if(error)return alert(error.message);location.href='chat.html?chat='+encodeURIComponent(data)};
    const f=$('#v272Follow');if(f)f.onclick=async()=>{if(rel.following){const {error}=await sb.rpc('unfollow_user',{p_target:p.id});if(error)return alert(error.message);rel.following=false;f.textContent='＋ Подписаться'}else{const {data,error}=await sb.rpc('follow_user',{p_target:p.id});if(error)return alert(error.message);rel.following=data?.status==='following';f.textContent=rel.following?'✓ Вы подписаны':'⏳ Запрос отправлен'}};
    const bl=$('#v272Block');if(bl)bl.onclick=async()=>{const rpc=rel.blocked_by_me?'unblock_user':'block_user';const {error}=await sb.rpc(rpc,{p_target:p.id});if(error)return alert(error.message);rel.blocked_by_me=!rel.blocked_by_me;bl.textContent=rel.blocked_by_me?'Разблокировать':'🚫 Заблокировать'};
  }

  async function renderSelf(b){const p=b.editable_profile||b.profile;show('#authBox',false);show('#publicProfileBox',false);show('#profileBox',true);if(!p)return;
    set('#displayName',p.display_name||'Пользователь');set('#username','@'+(p.username||''));html('#bigAvatar',avatarHtml(p));cover($('#profileCoverPreview'),p);set('#topAccount','@'+(p.username||'я'));
    const vals={pName:p.display_name||'',pUsername:p.username||'',pBio:p.bio||'',pStatus:p.status||'online'};for(const [id,v] of Object.entries(vals)){const e=$('#'+id);if(e)e.value=v}
    const s=b.social||{};set('#statFriends',s.friends||0);try{const [{count:ch},{count:ms}]=await Promise.all([sb.from('conversation_members').select('*',{count:'exact',head:true}).eq('user_id',p.id),sb.from('messages').select('*',{count:'exact',head:true}).eq('sender_id',p.id)]);set('#statChats',ch||0);set('#statMessages',ms||0)}catch{}
    const vb=$('#v24Badges');if(vb)vb.innerHTML=badges(p)+(p.stars!=null?`<span class="v24-badge">⭐ ${Number(p.stars||0)}</span>`:'');
  }

  async function run(){if((location.pathname.split('/').pop()||'').toLowerCase()!=='profile.html')return;try{const b=await bundle();if(!b)return; if(b.is_self)await renderSelf(b); else if(b.profile)await renderPublic(b); else {const ps=new URLSearchParams(location.search);if(ps.get('id')||ps.get('u')||ps.get('user'))await renderPublic(b)}}catch(e){console.error('RNDM profile v27.2',e);const box=$('#publicProfileBox')||$('#profileBox');if(box){box.style.display='block';box.innerHTML=`<div class="profile-card"><h1>Не удалось загрузить профиль</h1><p class="error">${esc(e.message||'Ошибка загрузки')}</p><button class="btn" onclick="location.reload()">Повторить</button></div>`}}
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(run,80),{once:true}):setTimeout(run,80);
})();
