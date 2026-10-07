
/* app.js — встроено в страницу */
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('rndm-theme');
if (savedTheme === 'light') body.classList.add('light');
if (themeToggle) themeToggle.textContent = body.classList.contains('light') ? '☀️' : '🌙';

themeToggle?.addEventListener('click', () => {
  body.classList.toggle('light');
  localStorage.setItem('rndm-theme', body.classList.contains('light') ? 'light' : 'dark');
  themeToggle.textContent = body.classList.contains('light') ? '☀️' : '🌙';
});

const rooms = document.querySelectorAll('.room');
const roomTitle = document.getElementById('roomTitle');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const randomRoom = document.getElementById('randomRoom');
const roomNames = ['Главная', 'Игры', 'Учёба', 'Музыка'];
let activeRandomPerson = null;
let replyTimer = null;

function addMessage(text, type = 'me', name = 'Я') {
  if (!messages) return;
  const item = document.createElement('div');
  item.className = `message ${type}`;
  item.innerHTML = `<b>${name}</b><p>${text}</p>`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

rooms.forEach(btn => {
  btn.addEventListener('click', () => {
    rooms.forEach(r => r.classList.remove('active'));
    btn.classList.add('active');
    activeRandomPerson = null;
    const room = btn.dataset.room;
    if (roomTitle) roomTitle.textContent = `# ${room}`;
    addMessage(`Вы перешли в комнату «${room}».`, 'other', 'RNDM Bot');
  });
});

randomRoom?.addEventListener('click', () => {
  const random = roomNames[Math.floor(Math.random() * roomNames.length)];
  const target = [...rooms].find(r => r.dataset.room === random);
  target?.click();
});

function getDemoReply(text, person) {
  const t = text.toLowerCase();
  const name = person?.[0] || 'Собеседник';
  const pools = {
    hello: ['Привет 👋 Рад знакомству!', 'Хэй! Как дела?', 'Привет :) Что делаешь?'],
    how: ['Нормально, спасибо 😄 А у тебя?', 'Отлично! Сегодня довольно спокойный день.', 'Всё хорошо. Решил зайти сюда пообщаться.'],
    name: [`Я ${name} 🙂 А тебя как зовут?`, `Можно просто ${name}. А ты?`],
    games: ['Да, люблю игры 🎮 Сейчас больше всего играю с друзьями.', 'Иногда играю. Что посоветуешь?', 'О, да! Кооперативные игры особенно нравятся.'],
    music: ['Музыку люблю 🎧 Обычно включаю что-нибудь спокойное.', 'Да! Скинул бы тебе свой плейлист, если бы тут уже были ссылки 😄'],
    school: ['Учёба бывает тяжёлая 😅 Но сегодня вроде нормально.', 'Смотря какой предмет. Информатика мне нравится больше всего.'],
    where: ['Я здесь просто в демо RNDM Chat 😄 А ты откуда?', 'Давай пока без точного адреса 😄 Но можем поговорить о городе.'],
    bye: ['Пока! Было приятно пообщаться 👋', 'Увидимся! Хорошего дня ✨'],
    default: ['Интересно 🙂 Расскажи подробнее.', 'Понимаю тебя. А что было дальше?', 'Хаха, прикольно 😄', 'Согласен! А ты давно этим интересуешься?', 'О, неожиданно. Почему именно так?', 'Звучит круто 👀', 'Да, я бы тоже так сделал.', 'А что тебе в этом нравится больше всего?']
  };
  if (/привет|здрав|хай|hello|hey/.test(t)) return pick(pools.hello);
  if (/как дела|как ты|как жизнь/.test(t)) return pick(pools.how);
  if (/как зовут|тво[её] имя|имя/.test(t)) return pick(pools.name);
  if (/игр|minecraft|майнкрафт|unreal|анрил/.test(t)) return pick(pools.games);
  if (/музык|песн|трек/.test(t)) return pick(pools.music);
  if (/уч[её]б|колледж|школ|урок/.test(t)) return pick(pools.school);
  if (/откуда|где жив/.test(t)) return pick(pools.where);
  if (/пока|до свид|увидим/.test(t)) return pick(pools.bye);
  return pick(pools.default);
}
function pick(items){ return items[Math.floor(Math.random()*items.length)]; }
function showTyping(name) {
  if (!messages) return null;
  const item = document.createElement('div');
  item.className = 'message other typing-message';
  item.innerHTML = `<b>${name}</b><p>печатает<span class="typing-dots">...</span></p>`;
  messages.appendChild(item); messages.scrollTop = messages.scrollHeight;
  return item;
}
function answerAsRandomPerson(text) {
  if (!activeRandomPerson) return;
  clearTimeout(replyTimer);
  const person = activeRandomPerson;
  const typing = showTyping(person[0]);
  replyTimer = setTimeout(() => {
    typing?.remove();
    if (activeRandomPerson === person) addMessage(getDemoReply(text, person), 'other', person[0]);
  }, 700 + Math.floor(Math.random()*1100));
}

messageForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  addMessage(text);
  messageInput.value = '';
  if (activeRandomPerson) answerAsRandomPerson(text);
  else setTimeout(() => addMessage('Сообщение получено ✅', 'other', 'RNDM Bot'), 350);
});

const PROFILE_KEY = 'rndm-profile-v1';
const defaultProfile = {name:'Сергей',nick:'Sergey_RNDM',age:'17',city:'Москва',status:'тестирую новый мессенджер',bio:'Люблю игры, сайты и новые проекты.',theme:'dark',avatar:''};
function loadProfile(){ try{return {...defaultProfile,...JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}}catch{return {...defaultProfile}} }
function saveProfileData(){
  const current=loadProfile(); const profile={name:document.getElementById('profileName')?.value.trim()||'Пользователь',nick:document.getElementById('profileNick')?.value.trim()||'rndm_user',age:document.getElementById('profileAge')?.value||'',city:document.getElementById('profileCity')?.value.trim()||'',status:document.getElementById('profileStatus')?.value.trim()||'',bio:document.getElementById('profileBio')?.value.trim()||'',theme:document.getElementById('profileTheme')?.value||'dark',avatar:current.avatar||''};
  localStorage.setItem(PROFILE_KEY,JSON.stringify(profile)); localStorage.setItem('rndm-theme',profile.theme);
  renderProfile(profile); document.body.classList.toggle('light',profile.theme==='light'); if(themeToggle) themeToggle.textContent=profile.theme==='light'?'☀️':'🌙';
  const note=document.getElementById('profileSaveNote'); if(note){note.textContent='✓ Профиль сохранён. Он восстановится после перезагрузки.';note.classList.add('profile-saved');setTimeout(()=>note.classList.remove('profile-saved'),600)}
}
function renderProfile(p){
  const map={profileName:p.name,profileNick:p.nick,profileAge:p.age,profileCity:p.city,profileStatus:p.status,profileBio:p.bio,profileTheme:p.theme};
  Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v});
  const title=document.getElementById('profileDisplayName'); if(title) title.textContent=p.nick||p.name;
  const status=document.getElementById('profileDisplayStatus'); if(status) status.textContent='Статус: '+(p.status||'в сети');
  const av=document.getElementById('profileAvatar'); if(av){ if(p.avatar){av.innerHTML=`<img src="${p.avatar}" alt="Аватар">`;av.classList.add('has-photo')}else{av.textContent=(p.name||p.nick||'R').charAt(0).toUpperCase();av.classList.remove('has-photo')} }
}
renderProfile(loadProfile());
document.getElementById('saveProfile')?.addEventListener('click', saveProfileData);

const avatarFile=document.getElementById('avatarFile');
const chooseAvatar=document.getElementById('chooseAvatar');
const avatarUploadButton=document.getElementById('avatarUploadButton');
const removeAvatar=document.getElementById('removeAvatar');
function openAvatarPicker(){ avatarFile?.click(); }
chooseAvatar?.addEventListener('click',openAvatarPicker);
avatarUploadButton?.addEventListener('click',openAvatarPicker);
avatarFile?.addEventListener('change',()=>{
  const file=avatarFile.files?.[0]; if(!file)return;
  if(!file.type.startsWith('image/'))return;
  if(file.size>4*1024*1024){ const note=document.getElementById('profileSaveNote'); if(note)note.textContent='Файл слишком большой. Выберите изображение до 4 МБ.'; return; }
  const reader=new FileReader();
  reader.onload=()=>{ const p=loadProfile(); p.avatar=reader.result; localStorage.setItem(PROFILE_KEY,JSON.stringify(p)); renderProfile(p); const note=document.getElementById('profileSaveNote');if(note)note.textContent='✓ Аватар изменён и сохранён.'; };
  reader.readAsDataURL(file);
});
removeAvatar?.addEventListener('click',()=>{ const p=loadProfile();p.avatar='';localStorage.setItem(PROFILE_KEY,JSON.stringify(p));renderProfile(p);if(avatarFile)avatarFile.value='';const note=document.getElementById('profileSaveNote');if(note)note.textContent='Аватар удалён.'; });


const randomPerson = document.getElementById('randomPerson');
const openRoulette = document.getElementById('openRoulette');
const roulettePanel = document.getElementById('roulettePanel');
const pickerPanel = document.getElementById('pickerPanel');
const normalMessenger = document.querySelector('.messenger:not(.roulette):not(.roulette-picker)');
const rouletteStatus = document.getElementById('rouletteStatus');
const rouletteBadge = document.getElementById('rouletteBadge');
const strangerAvatar = document.getElementById('strangerAvatar');
const strangerLabel = document.getElementById('strangerLabel');
const demoPeople = [
  ['Алекс', '🎧', 'Привет! Я тоже попал сюда случайно 👋'],
  ['Мия', '🌙', 'Привет! Как проходит день?'],
  ['Макс', '🎮', 'О, привет! Во что играешь?'],
  ['Лера', '✨', 'Привет :) Давай знакомиться!'],
  ['Ник', '🛹', 'Хэй! Что интересного?'],
  ['Аня', '📚', 'Привет! Чем увлекаешься?'],
  ['Даня', '⚡', 'Йо! Как настроение?'],
  ['Саша', '🎨', 'Привет :) Что сегодня делаешь?'],
  ['Кира', '🌸', 'Привет! Рада знакомству!']
];
function randomDemoPerson(){ return demoPeople[Math.floor(Math.random()*demoPeople.length)]; }
function hideSpecial(){roulettePanel?.classList.remove('active');pickerPanel?.classList.remove('active')}
function showChat(){ hideSpecial(); normalMessenger?.classList.remove('hidden'); }
function showRoulette(){ hideSpecial();normalMessenger?.classList.add('hidden'); roulettePanel?.classList.add('active'); }
function showPicker(){hideSpecial();normalMessenger?.classList.add('hidden');pickerPanel?.classList.add('active');renderReel();}
function connectRoulette(){
  if (!rouletteStatus) return;
  rouletteStatus.textContent='Ищем свободного собеседника…'; rouletteBadge.textContent='SEARCH'; strangerAvatar.textContent='…'; strangerLabel.textContent='Поиск…';
  setTimeout(()=>{ const p=randomDemoPerson(); strangerAvatar.textContent=p[1]; strangerLabel.textContent=p[0]+' • онлайн'; rouletteStatus.textContent='Соединение установлено • демо-режим'; rouletteBadge.textContent='LIVE'; },700);
}
const userReel=document.getElementById('userReel'); const pickerStatus=document.getElementById('pickerStatus'); const pickerBadge=document.getElementById('pickerBadge'); let spinning=false;
function renderReel(focus=-1){if(!userReel)return; const list=[...demoPeople,...demoPeople,...demoPeople];userReel.innerHTML=list.map((p,i)=>`<div class="reel-user ${i===focus?'focus':''}"><div class="face">${p[1]}</div><b>${p[0]}</b><small>● онлайн</small></div>`).join('');}
function openPersonChat(p){showChat();activeRandomPerson=p;if(roomTitle)roomTitle.textContent='🎲 '+p[0]+' • случайный собеседник';if(messages){messages.innerHTML='';addMessage('Рулетка выбрала пользователя '+p[0]+'. Начните диалог.','other','RNDM Bot');setTimeout(()=>addMessage(p[2],'other',p[0]),450)}}
function spinUserRoulette(){
  if(spinning || !userReel || !pickerPanel?.classList.contains('active')) return;
  spinning=true;
  const spinBtn=document.getElementById('spinUsers');
  if(spinBtn){spinBtn.disabled=true;spinBtn.textContent='Крутим…';}
  if(pickerBadge) pickerBadge.textContent='SPIN';
  if(pickerStatus) pickerStatus.textContent='Рулетка выбирает собеседника…';
  const winner=Math.floor(Math.random()*demoPeople.length);
  const totalSteps=22+winner;
  let step=0;
  let delay=55;
  const tick=()=>{
    const idx=step%demoPeople.length;
    renderReel(demoPeople.length+idx);
    const cards=[...userReel.children];
    const focus=cards[demoPeople.length+idx];
    focus?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
    step++;
    if(step<=totalSteps){
      if(step>totalSteps-8) delay+=38;
      setTimeout(tick,delay);
      return;
    }
    const p=demoPeople[winner];
    renderReel(demoPeople.length+winner);
    const finalCard=userReel.children[demoPeople.length+winner];
    finalCard?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
    if(pickerBadge) pickerBadge.textContent='FOUND';
    if(pickerStatus) pickerStatus.textContent='Выбран пользователь: '+p[0]+' — открываем чат…';
    if(spinBtn){spinBtn.disabled=false;spinBtn.textContent='Крутить ещё';}
    spinning=false;
    setTimeout(()=>openPersonChat(p),850);
  };
  tick();
}
randomPerson?.addEventListener('click',()=>{showPicker();setTimeout(spinUserRoulette,180)});
document.getElementById('spinUsers')?.addEventListener('click',spinUserRoulette);
document.getElementById('cancelPicker')?.addEventListener('click',()=>{spinning=false;showChat()});
openRoulette?.addEventListener('click',()=>{showRoulette();connectRoulette();});
document.getElementById('startRoulette')?.addEventListener('click',connectRoulette);
document.getElementById('nextRoulette')?.addEventListener('click',connectRoulette);
document.getElementById('stopRoulette')?.addEventListener('click',()=>{rouletteStatus.textContent='Чат остановлен';rouletteBadge.textContent='STOP';strangerAvatar.textContent='?';strangerLabel.textContent='Собеседник';});
document.getElementById('backToChat')?.addEventListener('click',showChat);
['toggleMic','toggleCam'].forEach(id=>document.getElementById(id)?.addEventListener('click',e=>{e.currentTarget.classList.toggle('danger'); e.currentTarget.textContent=(id==='toggleMic'?'🎙 ':'📷 ')+(e.currentTarget.classList.contains('danger')?'Выкл.':'Вкл.');}));

// ---- RNDM Chat v6: messenger power features ----
const CHAT_KEY='rndm-chat-history-v2', SETTINGS_KEY='rndm-settings-v2', ROULETTE_HISTORY='rndm-roulette-history';
function toast(t){const x=document.createElement('div');x.className='toast';x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}
function persistMessages(){if(!messages)return;const data=[...messages.querySelectorAll('.message')].map(m=>({html:m.innerHTML,type:m.classList.contains('me')?'me':'other'}));localStorage.setItem(CHAT_KEY,JSON.stringify(data))}
function restoreMessages(){if(!messages)return;try{const d=JSON.parse(localStorage.getItem(CHAT_KEY)||'null');if(d?.length){messages.innerHTML='';d.forEach(x=>{const n=document.createElement('div');n.className='message '+x.type;n.innerHTML=x.html;messages.appendChild(n)})}}catch{}}
restoreMessages();
const oldAddMessage=addMessage; addMessage=function(text,type='me',name='Я'){oldAddMessage(text,type,name);const m=messages?.lastElementChild;if(m){const a=document.createElement('div');a.className='message-actions';a.innerHTML=type==='me'?'<button data-act="react">❤️</button><button data-act="edit">✏️</button><button data-act="delete">🗑️</button>':'<button data-act="react">❤️</button><button data-act="reply">↩ Ответить</button>';m.appendChild(a)}persistMessages()};
messages?.addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b)return;const m=b.closest('.message'),p=m.querySelector('p');if(b.dataset.act==='delete'){m.remove();toast('Сообщение удалено')}if(b.dataset.act==='edit'){const v=prompt('Изменить сообщение',p.textContent);if(v!==null&&v.trim()){p.textContent=v.trim();toast('Сообщение изменено')}}if(b.dataset.act==='react'){let r=m.querySelector('.reaction');if(!r){r=document.createElement('span');r.className='reaction';r.textContent='❤️ 1';p.appendChild(r)}else r.remove()}if(b.dataset.act==='reply'){messageInput.value='↩ '+p.textContent.slice(0,35)+' — ';messageInput.focus()}persistMessages()});
document.getElementById('chatSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();messages.querySelectorAll('.message').forEach(m=>m.style.display=m.textContent.toLowerCase().includes(q)?'':'none')});
document.getElementById('clearChat')?.addEventListener('click',()=>{if(confirm('Очистить историю чата?')){messages.innerHTML='';persistMessages();toast('История очищена')}});
function settings(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}catch{return{}}}function setSetting(k,v){const s=settings();s[k]=v;localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))}
['pinChat','muteChat'].forEach(id=>{const b=document.getElementById(id);if(!b)return;const key=id==='pinChat'?'pinned':'muted';if(settings()[key])b.classList.add('on');b.addEventListener('click',()=>{b.classList.toggle('on');setSetting(key,b.classList.contains('on'));toast(key==='pinned'?(b.classList.contains('on')?'Чат закреплён':'Чат откреплён'):(b.classList.contains('on')?'Уведомления выключены':'Уведомления включены'))})});
function saveRoulettePerson(p){let h=[];try{h=JSON.parse(localStorage.getItem(ROULETTE_HISTORY)||'[]')}catch{}h=[p,...h.filter(x=>x[0]!==p[0])].slice(0,6);localStorage.setItem(ROULETTE_HISTORY,JSON.stringify(h));renderRouletteHistory()}
function renderRouletteHistory(){const box=document.getElementById('rouletteHistory');if(!box)return;let h=[];try{h=JSON.parse(localStorage.getItem(ROULETTE_HISTORY)||'[]')}catch{}box.innerHTML=h.length?h.map(p=>`<span class="history-chip">${p[1]} ${p[0]}</span>`).join(''):'<small>История пока пустая</small>'}renderRouletteHistory();
const oldOpenPersonChat=openPersonChat;openPersonChat=function(p){saveRoulettePerson(p);oldOpenPersonChat(p)};
// Keyboard shortcuts + draft autosave
const DRAFT='rndm-draft';if(messageInput){messageInput.value=localStorage.getItem(DRAFT)||'';messageInput.addEventListener('input',()=>localStorage.setItem(DRAFT,messageInput.value));messageForm?.addEventListener('submit',()=>localStorage.removeItem(DRAFT));document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();messageInput.focus()}if(e.key==='Escape'&&document.activeElement===messageInput)messageInput.blur()})}

// ---- v8: Channels + demo Stars ----
const CHANNELS_KEY='rndm-channels-v1', STARS_KEY='rndm-stars-v1', STAR_LOG_KEY='rndm-star-log-v1';
const starterChannels=[
 {id:'rndm-news',name:'RNDM News',icon:'📣',desc:'Новости проекта, обновления и новые функции.',subs:12840,joined:true,owner:false,posts:[{id:1,text:'Добро пожаловать в каналы RNDM Chat! Теперь здесь можно публиковать посты, ставить реакции и поддерживать авторов звёздами ⭐',likes:326,stars:54,date:'Сегодня, 10:30'}]},
 {id:'games',name:'Game Space',icon:'🎮',desc:'Игры, кооператив и игровые новости.',subs:8421,joined:false,owner:false,posts:[{id:1,text:'Во что играете на этой неделе? Делитесь своими находками в реакциях 👾',likes:214,stars:31,date:'Сегодня, 09:12'}]},
 {id:'study',name:'IT Start',icon:'💻',desc:'Программирование, сайты и полезные материалы для учёбы.',subs:5190,joined:true,owner:false,posts:[{id:1,text:'Мини-челлендж: сделайте сегодня одну маленькую функцию для своего проекта и доведите её до рабочего состояния.',likes:188,stars:42,date:'Вчера, 19:45'}]},
 {id:'music',name:'Night Music',icon:'🎧',desc:'Треки, плейлисты и музыкальные открытия.',subs:3307,joined:false,owner:false,posts:[{id:1,text:'Вечерний вопрос: какой трек у вас сейчас на повторе?',likes:91,stars:18,date:'Вчера, 22:03'}]}
];
function loadChannels(){try{const x=JSON.parse(localStorage.getItem(CHANNELS_KEY)||'null');return x?.length?x:structuredClone(starterChannels)}catch{return JSON.parse(JSON.stringify(starterChannels))}}
function saveChannels(x){localStorage.setItem(CHANNELS_KEY,JSON.stringify(x))}
function getStars(){return Number(localStorage.getItem(STARS_KEY)||250)}
function setStars(n){localStorage.setItem(STARS_KEY,String(Math.max(0,n)));const e=document.getElementById('starsBalance');if(e)e.textContent=getStars()}
function starLog(text,amount){let x=[];try{x=JSON.parse(localStorage.getItem(STAR_LOG_KEY)||'[]')}catch{}x.unshift({text,amount,date:new Date().toLocaleString('ru-RU')});localStorage.setItem(STAR_LOG_KEY,JSON.stringify(x.slice(0,40)))}
let channels=loadChannels(),activeChannel=channels[0]?.id;
function fmtSubs(n){return n>=1000?(n/1000).toFixed(n>=10000?0:1)+'K':String(n)}
function renderChannelList(filter=''){const box=document.getElementById('channelList');if(!box)return;const q=filter.toLowerCase();box.innerHTML=channels.filter(c=>(c.name+' '+c.desc).toLowerCase().includes(q)).map(c=>`<button class="channel-item ${c.id===activeChannel?'active':''}" data-channel="${c.id}"><span class="channel-icon">${c.icon}</span><span><b>${c.name}</b><small>${fmtSubs(c.subs)} подписчиков ${c.joined?'• ✓ подписка':''}</small></span></button>`).join('')||'<p class="lead">Ничего не найдено</p>';}
function renderActiveChannel(){const c=channels.find(x=>x.id===activeChannel);if(!c)return;const hero=document.getElementById('channelHero'),posts=document.getElementById('channelPosts'),composer=document.getElementById('ownerComposer');if(hero)hero.innerHTML=`<div class="channel-hero-top"><span class="channel-icon">${c.icon}</span><div><h2>${c.name}</h2><p>${c.desc}</p><small>${c.subs.toLocaleString('ru-RU')} подписчиков</small></div></div><div class="channel-actions"><button class="btn ${c.joined?'ghost':'primary'}" id="toggleSub">${c.joined?'✓ Вы подписаны':'Подписаться'}</button><button class="btn purple" id="sendChannelStars">⭐ Поддержать</button></div>`;if(composer)composer.classList.toggle('hidden',!c.owner);if(posts)posts.innerHTML=[...c.posts].reverse().map(p=>`<article class="channel-post"><div class="post-meta"><b>${c.name}</b><span>${p.date}</span></div><p>${p.text}</p><div class="post-actions"><button class="mini-btn" data-like="${p.id}">❤️ ${p.likes||0}</button><button class="mini-btn" data-starpost="${p.id}">⭐ ${p.stars||0}</button></div></article>`).join('')||'<p class="lead">Публикаций пока нет.</p>';document.getElementById('toggleSub')?.addEventListener('click',()=>{c.joined=!c.joined;c.subs+=c.joined?1:-1;saveChannels(channels);renderChannelList(document.getElementById('channelSearch')?.value||'');renderActiveChannel();toast(c.joined?'Вы подписались':'Подписка отменена')});document.getElementById('sendChannelStars')?.addEventListener('click',()=>sendStars(c));}
function sendStars(c,post){const raw=prompt(`Сколько ⭐ отправить ${post?'публикации':'каналу'} «${c.name}»?\nВаш баланс: ${getStars()} ⭐`,'10');if(raw===null)return;const n=Math.floor(Number(raw));if(!n||n<1)return toast('Введите количество звёзд');if(n>getStars())return toast('Недостаточно звёзд');setStars(getStars()-n);if(post)post.stars=(post.stars||0)+n;starLog(`Отправлено в ${c.name}`, -n);saveChannels(channels);renderActiveChannel();toast(`Отправлено ${n} ⭐`) }
document.getElementById('channelList')?.addEventListener('click',e=>{const b=e.target.closest('[data-channel]');if(!b)return;activeChannel=b.dataset.channel;renderChannelList(document.getElementById('channelSearch')?.value||'');renderActiveChannel()});
document.getElementById('channelPosts')?.addEventListener('click',e=>{const like=e.target.closest('[data-like]'),star=e.target.closest('[data-starpost]'),c=channels.find(x=>x.id===activeChannel);if(!c)return;if(like){const p=c.posts.find(x=>String(x.id)===like.dataset.like);p.likes=(p.likes||0)+1;saveChannels(channels);renderActiveChannel()}if(star){const p=c.posts.find(x=>String(x.id)===star.dataset.starpost);sendStars(c,p)}});
document.getElementById('channelSearch')?.addEventListener('input',e=>renderChannelList(e.target.value));
document.getElementById('demoStars')?.addEventListener('click',()=>{setStars(getStars()+100);starLog('Получено демо-пополнение',100);toast('+100 ⭐ добавлено')});
document.getElementById('createChannel')?.addEventListener('click',()=>{const name=prompt('Название нового канала');if(!name?.trim())return;const desc=prompt('Короткое описание канала','Мой канал в RNDM Chat')||'';const c={id:'user-'+Date.now(),name:name.trim(),icon:'📡',desc,subs:1,joined:true,owner:true,posts:[]};channels.unshift(c);activeChannel=c.id;saveChannels(channels);renderChannelList();renderActiveChannel();toast('Канал создан')});
document.getElementById('publishPost')?.addEventListener('click',()=>{const t=document.getElementById('postText'),c=channels.find(x=>x.id===activeChannel);if(!c?.owner||!t?.value.trim())return;c.posts.push({id:Date.now(),text:t.value.trim(),likes:0,stars:0,date:new Date().toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})});t.value='';saveChannels(channels);renderActiveChannel();toast('Публикация добавлена')});
function renderStarHistory(){const b=document.getElementById('starsHistory');if(!b)return;let x=[];try{x=JSON.parse(localStorage.getItem(STAR_LOG_KEY)||'[]')}catch{}b.innerHTML=x.length?x.map(i=>`<div class="star-row"><span>${i.text}<small><br>${i.date}</small></span><b>${i.amount>0?'+':''}${i.amount} ⭐</b></div>`).join(''):'<p>Операций пока нет.</p>'}
document.getElementById('openStarsHistory')?.addEventListener('click',()=>{renderStarHistory();document.getElementById('starsModal')?.classList.remove('hidden')});document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',()=>x.closest('.modal')?.classList.add('hidden')));
if(document.getElementById('channelList')){setStars(getStars());renderChannelList();renderActiveChannel()}

// ---- v10: attachments, contextual replies, comments, promotion roulette ----
const ATTACH_MAX_STORE = 700 * 1024;
let pendingAttachment = null;
const attachmentInput=document.getElementById('attachmentInput'), attachButton=document.getElementById('attachButton'), attachmentPreview=document.getElementById('attachmentPreview');
attachButton?.addEventListener('click',()=>attachmentInput.click());
attachmentInput?.addEventListener('change',()=>{const f=attachmentInput.files?.[0];if(!f)return;const url=URL.createObjectURL(f);pendingAttachment={file:f,url};attachmentPreview?.classList.remove('hidden');if(attachmentPreview)attachmentPreview.innerHTML=`<div><b>📎 ${f.name}</b><small>${(f.size/1024/1024).toFixed(2)} МБ • ${f.type||'файл'}</small></div><button class="mini-btn" id="cancelAttachment">×</button>`;document.getElementById('cancelAttachment')?.addEventListener('click',clearAttachment)});
function clearAttachment(){if(pendingAttachment?.url)URL.revokeObjectURL(pendingAttachment.url);pendingAttachment=null;if(attachmentInput)attachmentInput.value='';attachmentPreview?.classList.add('hidden');if(attachmentPreview)attachmentPreview.innerHTML=''}
function addAttachmentMessage(att){if(!messages||!att)return;const f=att.file,item=document.createElement('div');item.className='message me attachment-message';let media='';if(f.type.startsWith('image/'))media=`<img src="${att.url}" alt="${f.name}">`;else if(f.type.startsWith('video/'))media=`<video src="${att.url}" controls playsinline></video>`;else media=`<div class="file-card">📄 <span><b>${f.name}</b><small>${(f.size/1024).toFixed(0)} КБ</small></span></div>`;item.innerHTML=`<b>Я</b>${media}<p>${f.name}</p>`;messages.appendChild(item);messages.scrollTop=messages.scrollHeight;}
messageForm?.addEventListener('submit',()=>{if(pendingAttachment){const a=pendingAttachment;setTimeout(()=>{addAttachmentMessage(a);if(activeRandomPerson)setTimeout(()=>answerAsRandomPerson(`Я отправил файл ${a.file.name}`),250);clearAttachment()},0)}},true);

// Conversation-aware demo replies: use recent dialogue and current topic.
const contextByPerson={};
getDemoReply=function(text,person){const name=person?.[0]||'Собеседник',key=name,t=text.toLowerCase();const h=contextByPerson[key]||(contextByPerson[key]=[]);h.push(t);if(h.length>6)h.shift();const all=h.join(' ');let topic='общение';if(/игр|minecraft|майнкрафт|unreal|анрил|steam/.test(all))topic='игры';else if(/музык|песн|трек|исполнител/.test(all))topic='музыка';else if(/уч[её]б|колледж|школ|урок|проект|сайт|код/.test(all))topic='учёба и проекты';else if(/фильм|сериал|кино/.test(all))topic='кино';else if(/спорт|футбол|волейбол|тренир/.test(all))topic='спорт';if(/привет|здрав|хай|hello|hey/.test(t))return `Привет 👋 Я ${name}. О чём хочешь поговорить?`;if(/как дела|как ты|как жизнь/.test(t))return `Нормально 😄 А у тебя? Мы можем продолжить про ${topic}.`;if(/как зовут|тво[её] имя/.test(t))return `Я ${name} 🙂 А тебя как зовут?`;if(/пока|до свид|увидим/.test(t))return 'Пока! Было приятно пообщаться 👋';const topicReplies={
'игры':['Да, игры — хорошая тема 🎮 А во что ты сейчас играешь чаще всего?','Если выбирать кооператив, я бы играл с друзьями. Тебе больше нравится выживание или шутеры?','Ты упомянул игры — а какая механика для тебя самая важная?'],
'музыка':['🎧 А какой жанр тебе сейчас больше всего заходит?','Если продолжать про музыку: ты чаще слушаешь плейлисты или отдельных исполнителей?','Какой трек ты бы включил прямо сейчас?'],
'учёба и проекты':['Звучит как интересный проект. Что в нём уже реально работает?','Если продолжать про проект: интерфейс или функциональность сейчас важнее?','А какую следующую функцию ты хочешь добавить в проект?'],
'кино':['А какой фильм или сериал из последних тебе реально понравился?','Я бы продолжил тему кино: тебе больше нравятся комедии, фантастика или триллеры?'],
'спорт':['Круто. Ты сам занимаешься или больше смотришь?','А какая команда или вид спорта тебе нравится больше всего?'],
'общение':['Понял 🙂 Расскажи подробнее, интересно продолжить эту мысль.','А почему ты так думаешь?','Интересно. Что было дальше?']};return pick(topicReplies[topic]);};

// Comments for channel posts
function ensureComments(){channels.forEach(c=>c.posts.forEach(p=>{if(!Array.isArray(p.comments))p.comments=[]}))} ensureComments();
const baseRenderActiveChannel=renderActiveChannel;
renderActiveChannel=function(){baseRenderActiveChannel();ensureComments();const c=channels.find(x=>x.id===activeChannel),posts=document.getElementById('channelPosts');if(!c||!posts)return;posts.querySelectorAll('.channel-post').forEach((el,reverseIndex)=>{const p=[...c.posts].reverse()[reverseIndex];if(!p)return;const box=document.createElement('div');box.className='comments';box.innerHTML=`<button class="mini-btn comment-toggle">💬 Комментарии ${p.comments.length}</button><div class="comment-body hidden"><div class="comment-list">${p.comments.map(x=>`<div class="comment"><b>${x.name}</b><span>${x.text}</span></div>`).join('')||'<small>Комментариев пока нет.</small>'}</div><div class="comment-form"><input placeholder="Написать комментарий…"><button class="mini-btn">Отправить</button></div></div>`;el.appendChild(box);box.querySelector('.comment-toggle').onclick=()=>box.querySelector('.comment-body').classList.toggle('hidden');const inp=box.querySelector('input');box.querySelector('.comment-form button').onclick=()=>{const v=inp.value.trim();if(!v)return;p.comments.push({name:loadProfile().name||'Пользователь',text:v});saveChannels(channels);renderActiveChannel();toast('Комментарий добавлен')};});};
if(document.getElementById('channelPosts'))renderActiveChannel();

// Promotion roulette: costs 250 demo Stars and grants demo subscribers.
const promoModal=document.getElementById('promoModal'),promoChannel=document.getElementById('promoChannel'),promoReel=document.getElementById('promoReel'),promoStatus=document.getElementById('promoStatus');let promoSpinning=false;
function fillPromoChannels(){if(!promoChannel)return;const own=channels.filter(c=>c.owner);promoChannel.innerHTML=(own.length?own:channels).map(c=>`<option value="${c.id}">${c.name} • ${c.subs} подписчиков</option>`).join('')}
document.getElementById('promoRoulette')?.addEventListener('click',()=>{fillPromoChannels();promoModal?.classList.remove('hidden');if(promoStatus)promoStatus.textContent='Стоимость прокрутки: 250 ⭐'});
document.getElementById('spinPromo')?.addEventListener('click',()=>{if(promoSpinning)return;if(getStars()<250)return toast('Нужно 250 ⭐ для прокрутки');const c=channels.find(x=>x.id===promoChannel.value);if(!c)return;promoSpinning=true;setStars(getStars()-250);starLog('Рулетка продвижения',-250);let ticks=0;const values=[5,10,15,25,40,60,100,150,250,500];const timer=setInterval(()=>{promoReel.textContent='+'+pick(values);promoReel.classList.toggle('spin');ticks++;if(ticks>=18){clearInterval(timer);const weights=[5,10,15,25,40,60,100,150,250,500], win=pick(weights);c.subs+=win;saveChannels(channels);promoReel.textContent='+'+win;promoStatus.textContent=`🎉 ${c.name} получает +${win} демо-подписчиков!`;promoSpinning=false;renderChannelList();renderActiveChannel()}},90+ticks*3)});

// ---- v11: separate Chats and Contacts ----
const CONTACTS_KEY='rndm-contacts-v1', DIALOGS_KEY='rndm-dialogs-v1', OPEN_CONTACT_KEY='rndm-open-contact';
const starterContacts=[
 {id:'anya',name:'Аня',avatar:'📚',status:'онлайн • любит музыку',online:true,intro:'Привет! Рада снова тебя видеть 👋'},
 {id:'max',name:'Макс',avatar:'🎮',status:'онлайн • играет вечером',online:true,intro:'Йо! Что нового?'},
 {id:'kira',name:'Кира',avatar:'🌸',status:'онлайн • любит общаться',online:true,intro:'Привет :) Как настроение?'},
 {id:'kirill',name:'Кирилл',avatar:'⚡',status:'был 10 минут назад',online:false,intro:'Привет! Напиши, когда будешь свободен.'}
];
function loadContacts(){try{const x=JSON.parse(localStorage.getItem(CONTACTS_KEY)||'null');return Array.isArray(x)?x:starterContacts}catch{return starterContacts}}
function saveContacts(x){localStorage.setItem(CONTACTS_KEY,JSON.stringify(x))}
function loadDialogs(){try{const x=JSON.parse(localStorage.getItem(DIALOGS_KEY)||'null');return Array.isArray(x)?x:[]}catch{return[]}}
function saveDialogs(x){localStorage.setItem(DIALOGS_KEY,JSON.stringify(x))}
function personToContact(p){return {id:'roulette-'+p[0].toLowerCase(),name:p[0],avatar:p[1],status:'онлайн • найден через рулетку',online:true,intro:p[2]}}
function ensureDialog(c,preview='Новый диалог'){let d=loadDialogs(),x=d.find(v=>v.id===c.id);if(!x){x={id:c.id,name:c.name,avatar:c.avatar||'🙂',preview,unread:0,time:'сейчас'};d.unshift(x);saveDialogs(d)}return x}
function addToContacts(c){let cs=loadContacts();if(!cs.some(x=>x.id===c.id)){cs.unshift(c);saveContacts(cs);toast?.(`${c.name} добавлен в контакты`)}renderContacts();}
function openContactChat(c){ensureDialog(c);localStorage.setItem(OPEN_CONTACT_KEY,JSON.stringify(c));location.href='chat.html'}
function renderContacts(filter=''){const box=document.getElementById('contactList');if(!box)return;const q=filter.toLowerCase(),cs=loadContacts().filter(c=>(c.name+' '+c.status).toLowerCase().includes(q));box.innerHTML=cs.length?cs.map(c=>`<article class="contact-card" data-id="${c.id}"><div class="contact-avatar">${c.avatar||'🙂'}</div><div><b>${c.name}</b><br><small><span class="${c.online?'online-dot':''}">${c.online?'● ':''}</span>${c.status||'контакт'}</small></div><div class="contact-actions"><button class="btn primary" data-contact-chat>💬 Написать</button><button class="btn ghost" data-contact-remove>Удалить контакт</button></div></article>`).join(''):'<div class="empty-state">Контакты не найдены.</div>'}
renderContacts();
document.getElementById('contactSearch')?.addEventListener('input',e=>renderContacts(e.target.value));
document.getElementById('contactList')?.addEventListener('click',e=>{const card=e.target.closest('.contact-card');if(!card)return;const c=loadContacts().find(x=>x.id===card.dataset.id);if(!c)return;if(e.target.closest('[data-contact-chat]'))openContactChat(c);if(e.target.closest('[data-contact-remove]')){saveContacts(loadContacts().filter(x=>x.id!==c.id));renderContacts(document.getElementById('contactSearch')?.value||'');toast?.('Контакт удалён, история чата сохранена')}});
document.getElementById('addContact')?.addEventListener('click',()=>{const name=prompt('Имя контакта');if(!name?.trim())return;const c={id:'custom-'+Date.now(),name:name.trim(),avatar:'👤',status:'добавлен вручную',online:false,intro:'Привет!'};addToContacts(c)});
function renderDialogs(filter=''){const box=document.getElementById('dialogList');if(!box)return;const q=filter.toLowerCase();let ds=loadDialogs();if(!ds.length){loadContacts().slice(0,3).forEach(c=>ensureDialog(c,c.intro));ds=loadDialogs()}ds=ds.filter(d=>(d.name+' '+d.preview).toLowerCase().includes(q));box.innerHTML=ds.length?ds.map(d=>`<button class="dialog-item" data-dialog="${d.id}"><span class="dialog-avatar">${d.avatar||'🙂'}</span><span><b>${d.name}</b><small><br>${d.preview||'Открыть диалог'}</small></span>${d.unread?`<span class="unread">${d.unread}</span>`:'<small>'+d.time+'</small>'}</button>`).join(''):'<div class="empty-state">Диалогов пока нет. Откройте «Контакты».</div>'}
renderDialogs();document.getElementById('dialogSearch')?.addEventListener('input',e=>renderDialogs(e.target.value));
function activateContact(c){activeRandomPerson=[c.name,c.avatar||'🙂',c.intro||'Привет!'];if(roomTitle)roomTitle.textContent=`${c.avatar||'🙂'} ${c.name}`;const pr=document.getElementById('chatPresence');if(pr)pr.textContent=c.status||'контакт';if(messages){messages.innerHTML='';addMessage(c.intro||'Диалог открыт.','other',c.name)}document.querySelectorAll('.dialog-item').forEach(x=>x.classList.toggle('active',x.dataset.dialog===c.id));}
document.getElementById('dialogList')?.addEventListener('click',e=>{const b=e.target.closest('[data-dialog]');if(!b)return;const id=b.dataset.dialog,c=loadContacts().find(x=>x.id===id)||loadDialogs().find(x=>x.id===id);if(c)activateContact(c)});
if(document.getElementById('dialogList')){try{const c=JSON.parse(localStorage.getItem(OPEN_CONTACT_KEY)||'null');if(c){localStorage.removeItem(OPEN_CONTACT_KEY);activateContact(c)}}catch{}}
// Roulette acquaintance becomes a dialog; user can independently add them to Contacts.
const v11OpenPersonChat=openPersonChat;openPersonChat=function(p){v11OpenPersonChat(p);const c=personToContact(p);ensureDialog(c,p[2]);renderDialogs();setTimeout(()=>{if(!document.getElementById('saveRouletteContact')){const bar=document.querySelector('.powerbar');if(bar){const b=document.createElement('button');b.id='saveRouletteContact';b.className='mini-btn';b.textContent='➕ В контакты';b.onclick=()=>addToContacts(c);bar.appendChild(b)}}},50)};

// ---- v12: groups, voice, stories, gifts, levels, video dock and notepad ----
const XP_KEY='rndm-xp-v1', GIFTS_KEY='rndm-gifts-v1', NOTES_KEY='rndm-notepad-v1', GROUPS_KEY='rndm-groups-v1';
function getXP(){return +(localStorage.getItem(XP_KEY)||0)} function addXP(n){localStorage.setItem(XP_KEY,getXP()+n);renderLevel()}
function renderLevel(){const xp=getXP(),level=Math.floor(xp/100)+1,progress=xp%100,p=loadProfile();const n=document.getElementById('dockName'),a=document.getElementById('dockAvatar');if(n)n.textContent=p.name;if(a)a.innerHTML=p.avatar?`<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:'🙂';document.getElementById('levelText')&&(document.getElementById('levelText').textContent='Уровень '+level);document.getElementById('xpText')&&(document.getElementById('xpText').textContent=xp+' XP');document.getElementById('xpFill')&&(document.getElementById('xpFill').style.width=progress+'%')}
renderLevel();
const note=document.getElementById('notepad');if(note){note.value=localStorage.getItem(NOTES_KEY)||'';let nt;note.oninput=()=>{clearTimeout(nt);document.getElementById('noteSaved').textContent='Сохранение…';nt=setTimeout(()=>{localStorage.setItem(NOTES_KEY,note.value);document.getElementById('noteSaved').textContent='Сохранено ✓'},250)}}
document.getElementById('dockToggle')?.addEventListener('click',()=>document.getElementById('rightDock')?.classList.toggle('open'));
const pv=document.getElementById('personalVideo'),pvi=document.getElementById('personalVideoInput');let pvUrl='';document.getElementById('chooseVideo')?.addEventListener('click',()=>pvi.click());pvi?.addEventListener('change',()=>{const f=pvi.files[0];if(!f)return;if(pvUrl)URL.revokeObjectURL(pvUrl);pvUrl=URL.createObjectURL(f);pv.src=pvUrl;pv.play().catch(()=>{});localStorage.setItem('rndm-video-name',f.name);document.getElementById('videoInfo').textContent=f.name});document.getElementById('removeVideo')?.addEventListener('click',()=>{pv.removeAttribute('src');pv.load();localStorage.removeItem('rndm-video-name');document.getElementById('videoInfo').textContent='Видео не выбрано'});if(document.getElementById('videoInfo'))document.getElementById('videoInfo').textContent=localStorage.getItem('rndm-video-name')?'Последнее: '+localStorage.getItem('rndm-video-name')+' (выберите снова после перезапуска)':'Видео не выбрано';
// Stories demo
const storyPeople=[['Вы','➕'],['Аня','📚'],['Макс','🎮'],['Кира','🌸'],['RNDM','✨']];const sr=document.getElementById('storiesRow');if(sr)sr.innerHTML=storyPeople.map((x,i)=>`<button class="story" data-story="${i}"><span class="story-ring">${x[1]}</span><small>${x[0]}</small></button>`).join('');sr?.addEventListener('click',e=>{const b=e.target.closest('[data-story]');if(!b)return;const x=storyPeople[+b.dataset.story];if(+b.dataset.story===0){const text=prompt('Текст вашей истории');if(text){localStorage.setItem('rndm-my-story',text);toast('История опубликована на 24 часа (демо)');addXP(10)}}else alert(`${x[1]} История ${x[0]}\n\n${pick(['Сегодня отличный день ✨','Кто вечером в игру? 🎮','Новый пост уже в канале!','Просто хорошее настроение 😄'])}`)});
// Groups
function groups(){try{return JSON.parse(localStorage.getItem(GROUPS_KEY)||'[]')}catch{return[]}} function saveGroups(g){localStorage.setItem(GROUPS_KEY,JSON.stringify(g))}
document.getElementById('createGroup')?.addEventListener('click',()=>{const name=prompt('Название группы');if(!name?.trim())return;const g={id:'group-'+Date.now(),name:name.trim(),avatar:'👥',preview:'Группа создана',unread:0,time:'сейчас',group:true};const gs=groups();gs.unshift(g);saveGroups(gs);let ds=loadDialogs();ds.unshift(g);saveDialogs(ds);renderDialogs();toast('Группа создана');addXP(15)});
// Voice recording; real MediaRecorder when available, demo fallback otherwise
let recorder=null,chunks=[],recording=false;const vb=document.getElementById('voiceButton');vb?.addEventListener('click',async()=>{if(recording){recorder?.stop();return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'}),url=URL.createObjectURL(blob);const item=document.createElement('div');item.className='message me voice-message';item.innerHTML=`<b>Я</b><p>🎙 Голосовое сообщение</p><audio controls src="${url}"></audio>`;messages.appendChild(item);messages.scrollTop=messages.scrollHeight;recording=false;vb.classList.remove('recording');vb.textContent='🎙 Голос';addXP(5)};recorder.start();recording=true;vb.classList.add('recording');vb.textContent='⏹ Стоп'}catch{toast('Разрешите доступ к микрофону в браузере')}});
// Gifts
const giftDefs=[['🌹','Роза',15],['💝','Сердце',25],['🧸','Мишка',50],['👑','Корона',100],['🚀','Ракета',150],['💎','Алмаз',250],['🏆','Кубок',300],['🐱','Котик',75]];const gm=document.getElementById('giftModal'),gg=document.getElementById('giftGrid');if(gg)gg.innerHTML=giftDefs.map((g,i)=>`<button class="gift-btn" data-gift="${i}" title="${g[1]} • ${g[2]} ⭐">${g[0]}<small style="display:block;font-size:10px">${g[2]}⭐</small></button>`).join('');document.getElementById('giftOpen')?.addEventListener('click',()=>gm.classList.remove('hidden'));document.getElementById('giftClose')?.addEventListener('click',()=>gm.classList.add('hidden'));gg?.addEventListener('click',e=>{const b=e.target.closest('[data-gift]');if(!b)return;const g=giftDefs[+b.dataset.gift];if(typeof getStars==='function'&&getStars()<g[2])return toast('Недостаточно ⭐');if(typeof setStars==='function')setStars(getStars()-g[2]);addMessage(`${g[0]} Подарок «${g[1]}»`,'me','Я');let mine;try{mine=JSON.parse(localStorage.getItem(GIFTS_KEY)||'[]')}catch{mine=[]}mine.unshift({emoji:g[0],name:g[1],at:Date.now()});localStorage.setItem(GIFTS_KEY,JSON.stringify(mine.slice(0,20)));renderGifts();gm.classList.add('hidden');addXP(10)});function renderGifts(){const x=document.getElementById('myGifts');if(!x)return;let a;try{a=JSON.parse(localStorage.getItem(GIFTS_KEY)||'[]')}catch{a=[]}x.innerHTML=a.length?a.map(g=>`<span title="${g.name}" style="font-size:25px;margin:4px">${g.emoji}</span>`).join(''):'Пока нет подарков'}renderGifts();
// Reward ordinary chat activity with XP
messageForm?.addEventListener('submit',()=>setTimeout(()=>addXP(2),0));

