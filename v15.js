(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const K={stars:'rndm-stars-v1',xp:'rndm-xp-v1',progress:'rndm-v15-progress',daily:'rndm-v15-daily',notes:'rndm-v15-notifications',ach:'rndm-v15-achievements',clip:'rndm-v15-clips',saved:'rndm-v15-saved-clips',follow:'rndm-v15-following',gifts:'rndm-v15-collectibles',show:'rndm-v15-showcase'};
  const num=k=>Number(localStorage.getItem(k)||0); const stars=()=>num(K.stars); const xp=()=>num(K.xp); const setStars=n=>localStorage.setItem(K.stars,String(Math.max(0,Math.floor(n)))); const setXP=n=>{localStorage.setItem(K.xp,String(Math.max(0,Math.floor(n)))); localStorage.setItem('rndm-xp-v13',String(Math.max(0,Math.floor(n))))};
  const day=()=>new Date().toISOString().slice(0,10);
  function progress(){return read(K.progress,{messages:0,taps:0,clipLikes:0,clipComments:0,clipUploads:0,clipsViewed:0,gifts:0,shopBuys:0,days:{}})}
  function bump(key,n=1){const p=progress();p[key]=(p[key]||0)+n;p.days[day()]=p.days[day()]||{};p.days[day()][key]=(p.days[day()][key]||0)+n;write(K.progress,p);updateDaily();unlockAchievements();}
  function toast(txt){let e=document.createElement('div');e.className='v15-toast';e.textContent=txt;document.body.append(e);setTimeout(()=>e.remove(),2200)}
  function notify(title,text,icon='✨'){let a=read(K.notes,[]);a.unshift({id:Date.now()+Math.random(),title,text,icon,at:Date.now(),read:false});write(K.notes,a.slice(0,80));renderBell();}
  function addReward(x,s,reason){setXP(xp()+x);setStars(stars()+s);notify('Награда получена',`${reason}: +${x} XP${s?` и +${s} ⭐`:''}`,'🎁');toast(`+${x} XP${s?` • +${s} ⭐`:''}`)}
  function nav(){
    $$('.topbar nav,.topbar .nav').forEach(n=>{
      const links=[['clips.html','Clips ▶'],['activity.html','Активность'],['shop.html','Магазин ⭐']];
      links.forEach(([h,t])=>{if(!n.querySelector(`[href="${h}"]`))n.insertAdjacentHTML('beforeend',`<a href="${h}">${t}</a>`)});
    });
    const tb=$('.topbar'); if(tb&&!$('#v15Bell')){const a=document.createElement('a');a.id='v15Bell';a.className='v15-bell';a.href='activity.html#notifications';a.innerHTML='🔔<span id="v15BellCount"></span>';tb.insertBefore(a,$('#themeToggle')||null)};renderBell();
  }
  function renderBell(){const c=$('#v15BellCount');if(!c)return;const n=read(K.notes,[]).filter(x=>!x.read).length;c.textContent=n?String(Math.min(n,99)):'';c.style.display=n?'grid':'none'}
  nav();

  // Track core activity from existing UI.
  $('#messageForm')?.addEventListener('submit',()=>{const i=$('#messageInput');if(i&&i.value.trim())bump('messages')},true);
  $('#catTap')?.addEventListener('click',()=>bump('taps'));

  // ---- Clips 2.0 ----
  const defaultClips=[
    {id:'city',author:'@mira',avatar:'🌙',caption:'Ночной город и немного музыки ✨',sound:'Night Drive • RNDM',theme:'clip-city',likes:1284,comments:[['@max','Очень атмосферно 🔥'],['@lera','Сохранила!']]},
    {id:'game',author:'@max_play',avatar:'🎮',caption:'Когда прошёл сложный уровень с первой попытки 😎',sound:'Level Up • RNDM',theme:'clip-game',likes:931,comments:[['@anya','Да ладно 😄']]},
    {id:'cat',author:'@catlab',avatar:'🐱',caption:'Котик уже фармит монеты сам',sound:'Meow Beat',theme:'clip-cat',likes:2431,comments:[['@rndm','Нужен такой апгрейд!']]},
    {id:'code',author:'@code_room',avatar:'💻',caption:'Маленький проект сегодня > идеальный проект никогда',sound:'Focus Mode',theme:'clip-code',likes:742,comments:[]},
    {id:'travel',author:'@nika',avatar:'🌊',caption:'30 секунд спокойствия',sound:'Ocean Loop',theme:'clip-sea',likes:1870,comments:[['@mira','Красиво 💙']]}];
  function clipState(){return read(K.clip,{})} function saveClipState(s){write(K.clip,s)}
  function renderClips(){const feed=$('#clipsFeed');if(!feed)return; const st=clipState(),following=read(K.follow,[]),saved=read(K.saved,[]);
    feed.innerHTML=defaultClips.map((c,i)=>{const x=st[c.id]||{},liked=!!x.liked,likes=c.likes+(liked?1:0),com=[...(c.comments||[]),...(x.comments||[])];return `<article class="clip-slide ${c.theme}" data-clip="${c.id}" tabindex="0"><div class="clip-ambient"><span>${c.avatar}</span></div><div class="clip-gradient"></div><div class="clip-copy"><div class="clip-author"><div class="clip-avatar">${c.avatar}</div><b>${c.author}</b><button class="clip-follow ${following.includes(c.author)?'on':''}" data-follow="${c.author}">${following.includes(c.author)?'Подписан':'Подписаться'}</button></div><p>${c.caption}</p><small>♫ ${c.sound}</small></div><div class="clip-actions"><button data-like="${c.id}">${liked?'❤️':'🤍'}<small>${likes}</small></button><button data-comments="${c.id}">💬<small>${com.length}</small></button><button data-save="${c.id}">${saved.includes(c.id)?'🔖':'📑'}<small>${saved.includes(c.id)?'Сохранено':'Сохранить'}</small></button><button data-share="${c.id}">↗️<small>Поделиться</small></button><button data-no="${c.id}">🙈<small>Не интересно</small></button></div><div class="clip-index">${i+1}/${defaultClips.length}</div></article>`}).join('');
    let seen=new Set(); const io=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting&&en.intersectionRatio>.65&&!seen.has(en.target.dataset.clip)){seen.add(en.target.dataset.clip);bump('clipsViewed')}}),{threshold:[.65]});$$('.clip-slide',feed).forEach(x=>io.observe(x));
  }
  renderClips();
  $('#clipsFeed')?.addEventListener('click',e=>{
    const like=e.target.closest('[data-like]');if(like){const id=like.dataset.like,s=clipState();s[id]=s[id]||{};s[id].liked=!s[id].liked;saveClipState(s);if(s[id].liked){bump('clipLikes');setXP(xp()+2)}renderClips();return}
    const com=e.target.closest('[data-comments]');if(com){openComments(com.dataset.comments);return}
    const sv=e.target.closest('[data-save]');if(sv){let a=read(K.saved,[]),id=sv.dataset.save;a=a.includes(id)?a.filter(x=>x!==id):[id,...a];write(K.saved,a);toast(a.includes(id)?'Клип сохранён':'Удалено из сохранённых');renderClips();return}
    const f=e.target.closest('[data-follow]');if(f){let a=read(K.follow,[]),u=f.dataset.follow;a=a.includes(u)?a.filter(x=>x!==u):[u,...a];write(K.follow,a);notify(a.includes(u)?'Новая подписка':'Подписка отменена',u,'👤');renderClips();return}
    const sh=e.target.closest('[data-share]');if(sh){const text='RNDM Clips • '+defaultClips.find(c=>c.id===sh.dataset.share)?.caption;(navigator.share?navigator.share({title:'RNDM Clips',text}).catch(()=>{}):navigator.clipboard?.writeText(text));toast('Ссылка на клип подготовлена');return}
    const no=e.target.closest('[data-no]');if(no){no.closest('.clip-slide')?.classList.add('clip-hidden');setTimeout(()=>no.closest('.clip-slide')?.remove(),250);toast('Будем показывать меньше такого');return}
  });
  function openComments(id){const c=defaultClips.find(x=>x.id===id),s=clipState();s[id]=s[id]||{};const all=[...(c.comments||[]),...(s[id].comments||[])],m=$('#commentsModal');if(!m)return;m.dataset.id=id;$('#commentsTitle').textContent=`Комментарии • ${c.author}`;$('#commentsList').innerHTML=all.length?all.map(x=>`<div class="clip-comment"><b>${x[0]}</b><span>${x[1]}</span></div>`).join(''):'<div class="empty-state">Комментариев пока нет</div>';m.classList.add('open');}
  $('#closeComments')?.addEventListener('click',()=>$('#commentsModal')?.classList.remove('open'));
  $('#commentForm')?.addEventListener('submit',e=>{e.preventDefault();let v=$('#commentInput').value.trim(),m=$('#commentsModal');if(!v||!m?.dataset.id)return;let s=clipState(),id=m.dataset.id;s[id]=s[id]||{};s[id].comments=s[id].comments||[];s[id].comments.push(['@you',v]);saveClipState(s);$('#commentInput').value='';bump('clipComments');setXP(xp()+3);openComments(id);renderClips()});
  $('#uploadClip')?.addEventListener('click',()=>$('#clipFile')?.click());
  let userClipUrl='';$('#clipFile')?.addEventListener('change',()=>{const f=$('#clipFile').files?.[0];if(!f)return;if(!f.type.startsWith('video/'))return toast('Выберите видео');if(userClipUrl)URL.revokeObjectURL(userClipUrl);userClipUrl=URL.createObjectURL(f);const host=$('#userClipPreview');host.innerHTML=`<video src="${userClipUrl}" controls autoplay muted playsinline></video><div><b>${f.name}</b><br><small>Клип доступен в текущей сессии браузера</small></div>`;host.classList.remove('hidden');bump('clipUploads');setXP(xp()+15);notify('Клип опубликован','Ваш новый клип добавлен в демо-сессию','🎬')});

  // ---- Daily quests / achievements ----
  const TASKS=[{id:'msg',title:'На связи',desc:'Отправь 5 сообщений',key:'messages',goal:5,xp:25,stars:10,icon:'💬'},{id:'tap',title:'Котодень',desc:'Сделай 50 тапов',key:'taps',goal:50,xp:30,stars:15,icon:'🐱'},{id:'clips',title:'В ленте',desc:'Посмотри 5 Clips',key:'clipsViewed',goal:5,xp:20,stars:10,icon:'▶️'},{id:'social',title:'Реакции',desc:'Поставь 3 лайка Clips',key:'clipLikes',goal:3,xp:20,stars:10,icon:'❤️'}];
  function daily(){let d=read(K.daily,{date:day(),claimed:{}});if(d.date!==day())d={date:day(),claimed:{}};write(K.daily,d);return d}
  function todayVal(key){return progress().days?.[day()]?.[key]||0}
  function updateDaily(){const box=$('#dailyTasks');if(!box)return;const d=daily();box.innerHTML=TASKS.map(t=>{let v=Math.min(t.goal,todayVal(t.key)),done=v>=t.goal,claimed=!!d.claimed[t.id];return `<article class="task-card ${done?'done':''}"><span class="task-icon">${t.icon}</span><div><b>${t.title}</b><p>${t.desc}</p><div class="task-progress"><i style="width:${v/t.goal*100}%"></i></div><small>${v}/${t.goal} • +${t.xp} XP +${t.stars} ⭐</small></div><button data-claim="${t.id}" ${!done||claimed?'disabled':''}>${claimed?'Получено ✓':'Забрать'}</button></article>`}).join('');}
  $('#dailyTasks')?.addEventListener('click',e=>{const b=e.target.closest('[data-claim]');if(!b)return;const t=TASKS.find(x=>x.id===b.dataset.claim),d=daily();if(!t||d.claimed[t.id]||todayVal(t.key)<t.goal)return;d.claimed[t.id]=true;write(K.daily,d);addReward(t.xp,t.stars,t.title);updateDaily()});
  updateDaily();
  const ACH=[
    {id:'hello',icon:'🔥',name:'Начало пути',desc:'Открыть RNDM Chat',test:()=>true},
    {id:'talker',icon:'💬',name:'Собеседник',desc:'Отправить 25 сообщений',test:p=>p.messages>=25},
    {id:'cat100',icon:'🐱',name:'Котофан',desc:'Сделать 100 тапов',test:p=>p.taps>=100},
    {id:'cat1000',icon:'👑',name:'Повелитель кота',desc:'Сделать 1000 тапов',test:p=>p.taps>=1000},
    {id:'viewer',icon:'▶️',name:'Залип в Clips',desc:'Посмотреть 25 клипов',test:p=>p.clipsViewed>=25},
    {id:'heart',icon:'❤️',name:'Поддержка',desc:'Поставить 10 лайков',test:p=>p.clipLikes>=10},
    {id:'creator',icon:'🎬',name:'Автор',desc:'Добавить свой клип',test:p=>p.clipUploads>=1},
    {id:'collector',icon:'🎁',name:'Коллекционер',desc:'Получить 3 коллекционных подарка',test:()=>read(K.gifts,[]).length>=3},
    {id:'rich',icon:'⭐',name:'Звёздный запас',desc:'Накопить 1000 ⭐',test:()=>stars()>=1000}
  ];
  function unlockAchievements(){let p=progress(),u=read(K.ach,[]),changed=false;ACH.forEach(a=>{if(!u.includes(a.id)&&a.test(p)){u.push(a.id);changed=true;notify('Новое достижение',`${a.icon} ${a.name}`,'🏆');setXP(xp()+20)}});if(changed)write(K.ach,u);renderAchievements()}
  function renderAchievements(){const box=$('#achievementGrid');if(!box)return;const u=read(K.ach,[]),p=progress();box.innerHTML=ACH.map(a=>`<article class="achievement-card ${u.includes(a.id)?'unlocked':''}"><span>${a.icon}</span><div><b>${a.name}</b><p>${a.desc}</p></div><em>${u.includes(a.id)?'Открыто':'🔒'}</em></article>`).join('')}
  unlockAchievements();

  // ---- Notifications ----
  function renderNotifications(){const box=$('#notificationList');if(!box)return;const a=read(K.notes,[]);box.innerHTML=a.length?a.map(n=>`<article class="notification ${n.read?'read':''}" data-note="${n.id}"><span>${n.icon}</span><div><b>${n.title}</b><p>${n.text}</p><small>${new Date(n.at).toLocaleString('ru-RU')}</small></div></article>`).join(''):'<div class="empty-state">Уведомлений пока нет.</div>';}
  renderNotifications();$('#markRead')?.addEventListener('click',()=>{let a=read(K.notes,[]);a.forEach(n=>n.read=true);write(K.notes,a);renderNotifications();renderBell()});$('#clearNotifications')?.addEventListener('click',()=>{write(K.notes,[]);renderNotifications();renderBell()});

  // ---- Collectible gifts + inventory ----
  const GIFTS=[
    {id:'rose',e:'🌹',name:'Неоновая роза',rarity:'Обычный',price:70},{id:'bear',e:'🧸',name:'RNDM Мишка',rarity:'Редкий',price:150},{id:'catgift',e:'🐱',name:'Кибер-кот',rarity:'Редкий',price:180},{id:'rocket',e:'🚀',name:'Ракета',rarity:'Эпический',price:320},{id:'crown',e:'👑',name:'Корона',rarity:'Эпический',price:400},{id:'diamond',e:'💎',name:'Digital Diamond',rarity:'Легендарный',price:700},{id:'galaxy',e:'🌌',name:'Галактика',rarity:'Легендарный',price:900},{id:'phoenix',e:'🔥',name:'RNDM Phoenix',rarity:'Мифический',price:1400}
  ];
  function giftInventory(){return read(K.gifts,[])}
  function renderGiftShop(){const box=$('#collectibleShop');if(!box)return;const inv=giftInventory();box.innerHTML=GIFTS.map(g=>`<article class="collectible ${g.rarity.toLowerCase()}"><div class="gift-big">${g.e}</div><span class="rarity">${g.rarity}</span><b>${g.name}</b><small>${g.price} ⭐</small><button class="v13-btn" data-buygift="${g.id}" ${inv.includes(g.id)?'disabled':''}>${inv.includes(g.id)?'В коллекции ✓':'Купить'}</button></article>`).join('')}
  renderGiftShop();$('#collectibleShop')?.addEventListener('click',e=>{const b=e.target.closest('[data-buygift]');if(!b)return;const g=GIFTS.find(x=>x.id===b.dataset.buygift);if(!g)return;if(stars()<g.price)return toast('Недостаточно ⭐');setStars(stars()-g.price);let inv=giftInventory();if(!inv.includes(g.id))inv.push(g.id);write(K.gifts,inv);bump('gifts');bump('shopBuys');setXP(xp()+25);notify('Новый подарок в коллекции',`${g.e} ${g.name} • ${g.rarity}`,'🎁');renderGiftShop();renderV15Profile();$('#shopBalance')&&($('#shopBalance').textContent=stars())});
  function renderInventory(){const box=$('#v15Inventory');if(!box)return;const inv=giftInventory(),show=read(K.show,[]);box.innerHTML=inv.length?inv.map(id=>{const g=GIFTS.find(x=>x.id===id);if(!g)return'';return `<button class="inventory-gift ${show.includes(id)?'selected':''}" data-showgift="${id}" title="${g.name}"><span>${g.e}</span><small>${g.name}</small><em>${g.rarity}</em></button>`}).join(''):'<div class="empty-state">Подарков пока нет. Загляни в магазин ⭐.</div>'}
  $('#v15Inventory')?.addEventListener('click',e=>{const b=e.target.closest('[data-showgift]');if(!b)return;let s=read(K.show,[]),id=b.dataset.showgift;if(s.includes(id))s=s.filter(x=>x!==id);else if(s.length<3)s.push(id);else return toast('На витрине максимум 3 подарка');write(K.show,s);renderV15Profile()});
  function renderV15Profile(){if(!$('#v15ProfileStats'))return;const p=progress(),u=read(K.ach,[]),inv=giftInventory(),level=Math.floor(xp()/100)+1,show=read(K.show,[]);$('#v15ProfileStats').innerHTML=`<div><b>${level}</b><span>уровень</span></div><div><b>${xp()}</b><span>XP</span></div><div><b>${stars()}</b><span>⭐</span></div><div><b>${p.messages||0}</b><span>сообщений</span></div><div><b>${u.length}</b><span>достижений</span></div><div><b>${inv.length}</b><span>подарков</span></div>`;$('#giftShowcase').innerHTML=show.length?show.map(id=>{const g=GIFTS.find(x=>x.id===id);return g?`<span title="${g.name}">${g.e}</span>`:''}).join(''):'<small>Выбери до 3 подарков из инвентаря</small>';renderInventory();}
  renderV15Profile();

  // Bootstrap notification on first v15 visit.
  if(!localStorage.getItem('rndm-v15-welcome')){localStorage.setItem('rndm-v15-welcome','1');notify('RNDM v15 готов','Clips, задания, достижения, коллекции и новый профиль уже доступны.','🚀')}
})();
