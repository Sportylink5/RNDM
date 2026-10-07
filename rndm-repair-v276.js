// RNDM v27.7 repair layer: navigation, uploads, channel discussion
(()=>{
'use strict';
const d=document,w=window;
const ready=fn=>d.readyState==='loading'?d.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
const page=()=>((location.pathname.split('/').pop()||'index.html').toLowerCase());
const $=s=>d.querySelector(s);
const esc=s=>window.RNDMCloud?.esc?RNDMCloud.esc(s):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const toast=t=>{let x=d.createElement('div');x.className='v276-toast';x.textContent=t;d.body.appendChild(x);requestAnimationFrame(()=>x.classList.add('show'));setTimeout(()=>x.remove(),2600)};

function hardenBottomNav(){
  const nav=$('.rndm-mobile-bottom-nav');if(!nav)return;
  nav.style.setProperty('z-index','2147483000','important');
  nav.style.setProperty('pointer-events','auto','important');
  nav.querySelectorAll('a').forEach(a=>{a.style.setProperty('pointer-events','auto','important');a.style.setProperty('position','relative','important');a.style.setProperty('z-index','2','important')});
}

// Capture mobile navigation before any legacy handlers/overlays can swallow taps.
d.addEventListener('pointerup',e=>{
  const a=e.target.closest?.('.rndm-mobile-bottom-nav a[href]');if(!a)return;
  e.preventDefault();e.stopImmediatePropagation();
  location.assign(a.getAttribute('href'));
},true);

function wireClips(){
  if(page()!=='clips.html')return;
  const action=$('#rndmClipAction');
  if(action){action.classList.add('rndm-show-action');action.style.setProperty('display','inline-flex','important');action.innerHTML='＋<span>Clip</span>'}
  const C=w.RNDMCloud,sb=C?.getClient?.();
  let input=$('#v276ClipFile');if(!input){input=d.createElement('input');input.type='file';input.accept='video/*';input.id='v276ClipFile';input.hidden=true;d.body.appendChild(input)}
  let modal=$('#v276ClipModal');if(!modal){modal=d.createElement('div');modal.id='v276ClipModal';modal.className='v276-upload-modal';modal.innerHTML='<div class="v276-upload-card"><h2>🎬 Опубликовать Clip</h2><video id="v276ClipPreview" controls muted playsinline></video><input id="v276ClipCaption" maxlength="500" placeholder="Подпись к ролику…"><div id="v276ClipStatus" class="sub"></div><div class="v276-upload-actions"><button class="btn" id="v276ClipCancel">Отмена</button><button class="btn primary" id="v276ClipPublish">Опубликовать</button></div></div>';d.body.appendChild(modal)}
  const choose=()=>input.click();
  action?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();choose()},true);
  if(!$('#v276ClipUpload')){const b=d.createElement('button');b.id='v276ClipUpload';b.className='v276-floating-upload';b.type='button';b.textContent='＋ Загрузить Clip';b.onclick=choose;d.body.appendChild(b)}
  let objectUrl='';input.onchange=()=>{const f=input.files?.[0];if(!f)return;if(!String(f.type).startsWith('video/'))return toast('Выберите видео');if(f.size>100*1024*1024)return toast('Clip должен быть не больше 100 МБ');if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(f);$('#v276ClipPreview').src=objectUrl;$('#v276ClipCaption').value='';$('#v276ClipStatus').textContent=`${f.name} • ${(f.size/1024/1024).toFixed(1)} МБ`;modal.classList.add('open')};
  $('#v276ClipCancel').onclick=()=>{modal.classList.remove('open');input.value=''};
  $('#v276ClipPublish').onclick=async()=>{const f=input.files?.[0];if(!f||!sb||!C)return;const me=await C.user();if(!me)return toast('Сначала войдите в аккаунт');const b=$('#v276ClipPublish'),st=$('#v276ClipStatus');b.disabled=true;st.textContent='Загрузка видео…';let path='';try{const ext=(f.name.split('.').pop()||'mp4').replace(/[^a-z0-9]/gi,'')||'mp4';path=`${me.id}/${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from('clips').upload(path,f,{cacheControl:'3600',upsert:false,contentType:f.type||'video/mp4'});if(up.error)throw up.error;const url=sb.storage.from('clips').getPublicUrl(path).data.publicUrl;st.textContent='Публикация…';const {error}=await sb.from('clips').insert({user_id:me.id,video_url:url,caption:$('#v276ClipCaption').value.trim()});if(error)throw error;modal.classList.remove('open');input.value='';toast('Clip опубликован 🎬');setTimeout(()=>location.reload(),350)}catch(e){if(path)await sb.storage.from('clips').remove([path]).catch(()=>{});st.textContent=e?.message||'Ошибка загрузки'}finally{b.disabled=false}};
}
function wireVideos(){
  if(page()!=='videos.html')return;
  const action=$('#rndmClipAction');
  if(action){action.classList.add('rndm-show-action');action.style.setProperty('display','inline-flex','important');action.innerHTML='＋<span>Видео</span>'}
  const open=()=>$('#uploadModal')?.classList.add('open');
  action?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},true);
  $('#openUpload')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},true);
  if(!$('#v276VideoUpload')){const b=d.createElement('button');b.id='v276VideoUpload';b.className='v276-floating-upload';b.type='button';b.textContent='＋ Загрузить видео';b.onclick=open;d.body.appendChild(b)}
  const pub=$('#publishVideo');
  pub?.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const C=w.RNDMCloud,sb=C?.getClient?.(),me=await C?.user?.();if(!sb||!me)return toast('Сначала войдите в аккаунт');const f=$('#videoFile')?.files?.[0],title=$('#videoTitle')?.value.trim(),description=$('#videoDesc')?.value.trim()||'';if(!f||!title)return toast('Выберите видео и введите название');pub.disabled=true;const p=$('#uploadProgress i');if(p)p.style.width='15%';try{const att=await C.upload('videos',f,'uploads',250*1024*1024);if(p)p.style.width='75%';const {error}=await sb.from('rndm_videos').insert({user_id:me.id,title,description,video_url:att.url});if(error)throw error;if(p)p.style.width='100%';toast('Видео опубликовано 📺');setTimeout(()=>location.reload(),450)}catch(err){toast(err?.message||'Ошибка загрузки');if(p)p.style.width='0'}finally{pub.disabled=false}},true);
}
async function addChannelDiscussion(){
  if(page()!=='channels.html')return;
  const feed=$('#feed');if(!feed||$('#v276ChannelTalk'))return;
  const active=$('.ch.active[data-id]');const cid=active?.dataset.id;if(!cid)return;
  const C=w.RNDMCloud,sb=C?.getClient?.(),me=await C?.user?.();if(!sb||!me)return;
  const box=d.createElement('section');box.id='v276ChannelTalk';box.className='v276-channel-talk';box.innerHTML=`<div class="v276-talk-head"><b>💬 Обсуждение канала</b><span>Realtime</span></div><div id="v276TalkList" class="v276-talk-list"><div class="sub">Загрузка…</div></div><form id="v276TalkForm" class="v276-talk-form"><input id="v276TalkInput" maxlength="2000" placeholder="Написать в канал…"><button class="btn primary">Отправить</button></form><div id="v276TalkHint" class="sub"></div>`;
  feed.appendChild(box);
  const list=$('#v276TalkList'),form=$('#v276TalkForm'),inp=$('#v276TalkInput'),hint=$('#v276TalkHint');
  async function load(){
    const {data,error}=await sb.from('rndm_channel_messages').select('id,user_id,body,created_at').eq('channel_id',cid).order('created_at',{ascending:true}).limit(100);
    if(error){list.innerHTML='<div class="notice">'+esc(error.message)+'</div>';return}
    const rows=data||[],ids=[...new Set(rows.map(x=>x.user_id))];let people=[];
    if(ids.length){const r=await sb.from('profiles').select('id,username,display_name,avatar_url').in('id',ids);people=r.data||[]}
    const pm=Object.fromEntries(people.map(p=>[p.id,p]));
    list.innerHTML=rows.length?rows.map(m=>{const p=pm[m.user_id]||{},name=p.display_name||p.username||'Пользователь';return `<div class="v276-talk-msg"><a href="profile.html?id=${encodeURIComponent(m.user_id)}"><b>${esc(name)}</b> <small>@${esc(p.username||'user')}</small></a><div>${esc(m.body)}</div></div>`}).join(''):'<div class="sub">Сообщений пока нет.</div>';
    list.scrollTop=list.scrollHeight;
  }
  form.onsubmit=async e=>{e.preventDefault();const body=inp.value.trim();if(!body)return;const b=form.querySelector('button');b.disabled=true;const {error}=await sb.from('rndm_channel_messages').insert({channel_id:cid,user_id:me.id,body});b.disabled=false;if(error){hint.textContent=error.message.includes('row-level')?'Сначала подпишись на канал, затем можно писать.':error.message;return}inp.value='';hint.textContent='';await load()};
  const ch=sb.channel('v276-channel-talk-'+cid).on('postgres_changes',{event:'*',schema:'public',table:'rndm_channel_messages',filter:'channel_id=eq.'+cid},load).subscribe();
  box.dataset.channel=cid;box._rndmChannel=ch;await load();
}

function observeChannels(){
  if(page()!=='channels.html')return;const feed=$('#feed');if(!feed)return;
  let last='';const sync=()=>{const cid=$('.ch.active[data-id]')?.dataset.id||'';if(!cid||cid===last&&$('#v276ChannelTalk'))return;last=cid;const old=$('#v276ChannelTalk');if(old?._rndmChannel)window.RNDMCloud?.getClient?.()?.removeChannel?.(old._rndmChannel);old?.remove();setTimeout(addChannelDiscussion,30)};
  new MutationObserver(()=>{clearTimeout(feed._v276t);feed._v276t=setTimeout(sync,60)}).observe(feed,{childList:true,subtree:false});
  d.addEventListener('click',e=>{if(e.target.closest?.('.ch[data-id]'))setTimeout(sync,80)},true);setTimeout(sync,250);
}

ready(()=>{
  hardenBottomNav();wireClips();wireVideos();observeChannels();
  new MutationObserver(hardenBottomNav).observe(d.body,{childList:true,subtree:true});
});
})();
