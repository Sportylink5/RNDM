(()=>{
'use strict';
const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
const pg=()=>location.pathname.split('/').pop()||'index.html';
const esc=s=>window.RNDMCloud?.esc?RNDMCloud.esc(String(s??'')):String(s??'').replace(/[&<>"']/g,'');
const toast=t=>window.RNDMV26?.toast?RNDMV26.toast(t):console.log(t);
let sb,me,profile;

async function identity(){if(!window.RNDMCloud?.configured?.())return false;sb=RNDMCloud.getClient();me=await RNDMCloud.user();if(!me)return false;profile=await RNDMCloud.profile(me.id);return true}

async function maintenance(){
  if(!sb||!me)return;
  const {data}=await sb.from('app_settings').select('value').eq('key','maintenance_enabled').maybeSingle();
  const on=data?.value===true||String(data?.value)==='true';
  const staff=['owner','admin','moderator'].includes(profile?.app_role);
  if(!on||staff)return;
  if(document.getElementById('v26Maintenance'))return;
  const e=document.createElement('div');e.id='v26Maintenance';e.className='v26-maintenance';
  e.innerHTML='<div><div class="v26-maint-logo">R</div><h1>RNDM на техработах</h1><p>Сейчас устанавливаем обновление. Попробуй зайти немного позже.</p><button onclick="location.reload()">Проверить снова</button></div>';
  document.body.appendChild(e);
}

function swipeReply(){
  if(pg()!=='chat.html')return;
  let start=null, target=null;
  const reset=()=>{if(target)target.style.transform='';start=null;target=null};
  document.addEventListener('pointerdown',e=>{
    const w=e.target.closest?.('#messages .msg-wrap');if(!w||e.pointerType==='mouse'&&e.button!==0)return;
    start={x:e.clientX,y:e.clientY,id:e.pointerId};target=w;
  },{passive:true});
  document.addEventListener('pointermove',e=>{
    if(!start||e.pointerId!==start.id||!target)return;
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    if(Math.abs(dy)>45){reset();return}
    if(dx>0&&dx<95)target.style.transform=`translateX(${Math.min(70,dx*.65)}px)`;
  },{passive:true});
  document.addEventListener('pointerup',e=>{
    if(!start||e.pointerId!==start.id||!target)return reset();
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    const w=target;reset();
    if(dx>72&&Math.abs(dy)<45){const b=w.querySelector('[data-reply]');if(b){b.click();navigator.vibrate?.(18)}}
  },{passive:true});
  document.addEventListener('pointercancel',reset,{passive:true});
}

async function stockExtras(){
  if(pg()!=='stocks.html'||!sb)return;
  const root=document.querySelector('.wrap,main');if(!root||document.getElementById('v26InvestorBoard'))return;
  const sec=document.createElement('section');sec.className='v26-profile-card';sec.id='v26InvestorBoard';
  sec.innerHTML='<h2>🏆 Топ инвесторов</h2><div id="v26Investors" class="v26-list"></div><p class="v26-muted">Стоимость портфеля считается по текущим виртуальным ценам RNDM.</p>';
  root.appendChild(sec);
  const {data,error}=await sb.rpc('stock_investor_leaderboard',{p_limit:20});
  sec.querySelector('#v26Investors').innerHTML=error?`<span class="v26-muted">${esc(error.message)}</span>`:(data||[]).map((x,i)=>`<a class="v26-list-row" href="profile.html?user=${x.user_id}"><b>#${i+1}</b>${x.avatar_url?`<img class="v26-avatar" src="${esc(x.avatar_url)}">`:`<span class="v26-avatar">${esc((x.display_name||x.username||'?')[0])}</span>`}<div style="flex:1"><b>${esc(x.display_name||x.username)}</b><small>@${esc(x.username)}</small></div><strong>${Number(x.portfolio_value||0).toLocaleString('ru-RU')} R₽</strong></a>`).join('')||'<span class="v26-muted">Портфелей пока нет</span>';

  // Add period buttons to the existing stock chart modal and replace chart data on demand.
  const modal=document.getElementById('chartModal');
  if(modal){
    const obs=new MutationObserver(()=>{
      const body=document.getElementById('chartBody');if(!body||body.querySelector('.v26-periods'))return;
      const title=body.querySelector('h2')?.textContent||'';
      const ticker=title.trim().split(/\s+/)[1]||'';
      const asset=[...document.querySelectorAll('[data-chart]')].map(x=>x.dataset.chart).find(Boolean);
      const periods=document.createElement('div');periods.className='v26-periods';periods.innerHTML='<button data-p="1d">1д</button><button data-p="7d" class="on">7д</button><button data-p="30d">30д</button><button data-p="all">Всё</button>';
      body.insertBefore(periods,body.children[2]||null);
      periods.querySelectorAll('button').forEach(b=>b.onclick=async()=>{
        const openId=document.querySelector('#stocks [data-chart]:focus')?.dataset.chart || document.querySelector('#chartModal')?.dataset.stockId;
        const id=openId||asset;if(!id)return;
        const {data}=await sb.rpc('stock_chart_data',{p_stock:id,p_period:b.dataset.p});
        const h=data||[],chart=body.querySelector('.chart');
        if(chart&&h.length>1){const vals=h.map(x=>Number(x.price)),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min),pts=vals.map((v,i)=>`${(i/(vals.length-1)*100).toFixed(2)},${(100-(v-min)/range*88-6).toFixed(2)}`).join(' ');chart.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>`}
        periods.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
      });
    });obs.observe(modal,{subtree:true,childList:true});
    document.addEventListener('click',e=>{const b=e.target.closest('[data-chart]');if(b)modal.dataset.stockId=b.dataset.chart},true);
  }
}

async function adminExtras(){
  if(pg()!=='admin.html'||!sb||!['owner','admin'].includes(profile?.app_role))return;
  const root=document.querySelector('#adminApp,main')||document.body;if(document.getElementById('v26MaintenanceAdmin'))return;
  const {data:set}=await sb.from('app_settings').select('value').eq('key','maintenance_enabled').maybeSingle();
  const on=set?.value===true||String(set?.value)==='true';
  const s=document.createElement('section');s.id='v26MaintenanceAdmin';s.className='v26-profile-card';
  s.innerHTML=`<h2>🛠️ Режим техработ</h2><p class="v26-muted">Когда включён, обычные пользователи видят экран технических работ. Админы и модераторы продолжают работать.</p><button class="v26-btn" id="v26MaintToggle">${on?'Выключить техработы':'Включить техработы'}</button><hr style="border-color:#ffffff18;margin:18px 0"><h3>Ограничить пользователя</h3><div class="v26-custom-grid"><label>User ID<input id="v26RestrictUid" placeholder="UUID пользователя"></label><label>Мут, минут<input id="v26MuteMins" type="number" min="0" value="60"></label><label>Запрет публикаций, минут<input id="v26PubMins" type="number" min="0" value="60"></label></div><button class="v26-btn" id="v26RestrictApply">Применить</button>`;
  root.appendChild(s);
  s.querySelector('#v26MaintToggle').onclick=async()=>{if(!confirm(`${on?'Выключить':'Включить'} режим техработ?`))return;const {error}=await sb.rpc('admin_set_maintenance',{p_enabled:!on});if(error)alert(error.message);else location.reload()};
  s.querySelector('#v26RestrictApply').onclick=async()=>{const uid=s.querySelector('#v26RestrictUid').value.trim(),m=Number(s.querySelector('#v26MuteMins').value||0),p=Number(s.querySelector('#v26PubMins').value||0);if(!uid)return toast('Укажи User ID');const {error}=await sb.rpc('admin_set_user_restrictions',{p_target:uid,p_muted_until:m?new Date(Date.now()+m*60000).toISOString():null,p_publish_blocked_until:p?new Date(Date.now()+p*60000).toISOString():null});if(error)alert(error.message);else toast('Ограничения применены')};
}

function clipsExtras(){
  if(pg()!=='clips.html')return;
  const feed=document.getElementById('clipsFeed');if(!feed||document.getElementById('v26TrendBar'))return;
  const bar=document.createElement('div');bar.id='v26TrendBar';bar.className='v26-trends';bar.innerHTML='<b>🔥 Тренды:</b><button>#rndm</button><button>#игры</button><button>#музыка</button><button>#котики</button><button>#код</button>';
  feed.parentElement?.insertBefore(bar,feed);
  bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{const q=b.textContent.slice(1).toLowerCase();let any=false;document.querySelectorAll('.clip-slide').forEach(sl=>{const txt=sl.textContent.toLowerCase();const show=txt.includes(q)||q==='rndm';sl.style.display=show?'':'none';any ||= show});toast(any?'Фильтр '+b.textContent:'Пока нет клипов по '+b.textContent)});
}

async function seasonHooks(){
  if(!sb||!me)return;
  // Award daily login once; other actions are awarded from feature handlers.
  const key='rndm-v26-season-daily-'+new Date().toISOString().slice(0,10);
  if(!localStorage.getItem(key)){localStorage.setItem(key,'1');sb.rpc('award_season_action',{p_action:'daily'}).catch(()=>{})}
}



async function chatLibrary(){
  if(pg()!=='chat.html'||!sb||!me)return;
  let archived=false;
  const attach=()=>{
    const sh=document.querySelector('.side-head');if(!sh||document.getElementById('v26ArchiveView'))return;
    const bar=document.createElement('div');bar.className='v26-chat-library';bar.innerHTML='<button id="v26ArchiveView">🗄️ Архив</button><button id="v26SavedView">⭐ Избранное</button>';
    sh.appendChild(bar);
    bar.querySelector('#v26ArchiveView').onclick=async()=>{archived=!archived;bar.querySelector('#v26ArchiveView').classList.toggle('on',archived);await filterDialogs()};
    bar.querySelector('#v26SavedView').onclick=showSaved;
  };
  async function filterDialogs(){
    const rows=[...document.querySelectorAll('#dialogList .row[data-cid]')];if(!rows.length)return;
    const ids=rows.map(x=>x.dataset.cid);const {data:prefs}=await sb.from('conversation_preferences').select('*').eq('user_id',me.id).in('conversation_id',ids);
    const map=Object.fromEntries((prefs||[]).map(x=>[x.conversation_id,x]));
    rows.forEach(r=>{const x=map[r.dataset.cid];r.style.display=archived?(x?.is_archived?'':'none'):(x?.is_archived?'none':'');r.classList.toggle('v26-pinned-dialog',!!x?.is_pinned)});
    const host=document.getElementById('dialogList');if(host){const sorted=rows.filter(r=>r.style.display!=='none').sort((a,b)=>Number(b.classList.contains('v26-pinned-dialog'))-Number(a.classList.contains('v26-pinned-dialog')));sorted.forEach(r=>host.appendChild(r))}
  }
  async function showSaved(){
    const {data}=await sb.from('saved_messages').select('created_at,message:messages(id,body,attachment_name,created_at,conversation_id,sender:profiles!messages_sender_id_fkey(username,display_name))').eq('user_id',me.id).order('created_at',{ascending:false}).limit(100);
    let m=document.getElementById('v26SavedModal');if(m)m.remove();m=document.createElement('div');m.id='v26SavedModal';m.className='v26-modal open';m.innerHTML=`<div class="v26-modal-card"><div class="v26-profile-title"><h2>⭐ Избранные сообщения</h2><button data-close>×</button></div><div class="v26-list">${(data||[]).map(x=>`<a class="v26-list-row" href="chat.html?chat=${x.message?.conversation_id||''}"><span>💬</span><div><b>${esc(x.message?.sender?.display_name||x.message?.sender?.username||'Сообщение')}</b><small>${esc(x.message?.body||x.message?.attachment_name||'Вложение')} · ${x.message?.created_at?new Date(x.message.created_at).toLocaleString('ru-RU'):''}</small></div></a>`).join('')||'<span class="v26-muted">Пока пусто</span>'}</div></div>`;document.body.appendChild(m);m.querySelector('[data-close]').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};
  }
  async function pinnedPanel(){
    const cid=document.querySelector('#dialogList .row.active')?.dataset.cid||new URLSearchParams(location.search).get('chat');if(!cid)return;
    const head=document.querySelector('#chatPane .chat-head');if(!head||head.nextElementSibling?.classList.contains('v26-pinned-panel'))return;
    const {data}=await sb.from('pinned_messages').select('message_id,message:messages(body,attachment_name)').eq('conversation_id',cid).order('created_at',{ascending:false}).limit(3);
    if(!(data||[]).length)return;
    const panel=document.createElement('div');panel.className='v26-pinned-panel';panel.innerHTML=(data||[]).map(x=>`<button data-mid="${x.message_id}">📌 ${esc(x.message?.body||x.message?.attachment_name||'Сообщение')}</button>`).join('');head.after(panel);panel.querySelectorAll('button').forEach(b=>b.onclick=()=>document.querySelector(`[data-mid="${b.dataset.mid}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}));
  }
  const mo=new MutationObserver(()=>{attach();clearTimeout(mo._t);mo._t=setTimeout(()=>{filterDialogs();pinnedPanel()},250)});mo.observe(document.body,{childList:true,subtree:true});attach();setTimeout(()=>{filterDialogs();pinnedPanel()},500);
}

async function cloudClipModes(){
  if(pg()!=='clips.html'||!sb||!me)return;
  const histKey='rndm-v26-cloud-clip-history';
  const seen=new Set();
  const track=async el=>{const id=el.dataset.realClip;if(!id||seen.has(id))return;seen.add(id);let h=[];try{h=JSON.parse(localStorage.getItem(histKey)||'[]')}catch{}h=[id,...h.filter(x=>x!==id)].slice(0,100);localStorage.setItem(histKey,JSON.stringify(h));await sb.from('clip_views').insert({clip_id:id,user_id:me.id,watched_ms:1000}).catch(()=>{});sb.rpc('award_season_action',{p_action:'clip_view'}).catch(()=>{})};
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.7)track(e.target)}),{threshold:[.7]});
  const bind=()=>document.querySelectorAll('.real-clip:not([data-v26tracked])').forEach(x=>{x.dataset.v26tracked='1';io.observe(x)});
  const mo=new MutationObserver(bind);const feed=document.getElementById('clipsFeed');if(feed)mo.observe(feed,{childList:true});bind();
  document.addEventListener('click',async e=>{
    const b=e.target.closest('.v26-clips-tabs [data-v26feed]');if(!b)return;
    const mode=b.dataset.v26feed;if(!['saved','subs','history','all'].includes(mode))return;
    e.stopImmediatePropagation();e.preventDefault();
    let allowed=null;
    if(mode==='saved'){const {data}=await sb.from('clip_saves').select('clip_id').eq('user_id',me.id);allowed=new Set((data||[]).map(x=>x.clip_id));}
    if(mode==='subs'){const {data}=await sb.from('rndm_follows').select('followee_id').eq('follower_id',me.id);allowed=new Set((data||[]).map(x=>x.followee_id));}
    if(mode==='history'){let h=[];try{h=JSON.parse(localStorage.getItem(histKey)||'[]')}catch{}allowed=new Set(h);}
    document.querySelectorAll('.real-clip').forEach(sl=>{let show=true;if(mode==='saved'||mode==='history')show=allowed.has(sl.dataset.realClip);else if(mode==='subs')show=allowed.has(sl.dataset.user);sl.style.display=show?'':'none'});
    document.querySelectorAll('.v26-clips-tabs button').forEach(x=>x.classList.toggle('on',x===b));
  },true);
}

async function profileFeaturedClips(){
  if(pg()!=='profile.html'||!sb||!me)return;
  const uid=new URLSearchParams(location.search).get('user')||me.id;
  const root=document.querySelector('main,.shell,.page');if(!root||document.getElementById('v26FeaturedClips'))return;
  const {data}=await sb.from('featured_clips').select('position,clip_id,clip:clips(id,video_url,caption,created_at)').eq('user_id',uid).order('position').limit(6);
  if(!(data||[]).length&&uid!==me.id)return;
  const sec=document.createElement('section');sec.id='v26FeaturedClips';sec.className='v26-profile-card';
  sec.innerHTML=`<div class="v26-profile-title"><h2>🎬 Избранные Clips</h2><a href="clips.html">Открыть Clips</a></div><div class="v26-featured-clips">${(data||[]).map(x=>`<a href="clips.html#clip-${x.clip_id}" class="v26-featured-clip"><video src="${esc(x.clip?.video_url||'')}#t=0.1" muted playsinline preload="metadata"></video><span>${esc(x.clip?.caption||'Clip')}</span></a>`).join('')||'<span class="v26-muted">Нажми «📌 В профиль» на своём Clip, чтобы добавить его сюда.</span>'}</div>`;
  root.appendChild(sec);
}

async function init(){if(!await identity())return;await maintenance();swipeReply();clipsExtras();await Promise.allSettled([stockExtras(),adminExtras(),seasonHooks(),profileFeaturedClips(),chatLibrary(),cloudClipModes()]);}
ready(init);
})();
