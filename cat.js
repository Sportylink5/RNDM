(()=>{
const $=s=>document.querySelector(s), KEY='rndmCatV2', OLD='rndmCatV1', STAR='rndmStarsV1';
const defaults={coins:0,totalCoins:0,totalTaps:0,bestCombo:1,up:{power:0,auto:0,combo:0,crit:0,starLuck:0,offline:0},lastSeen:Date.now()};
let s; try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){};
if(!s){let old={};try{old=JSON.parse(localStorage.getItem(OLD)||'{}')}catch(e){}; const legacy=Number(old.taps||0);s={...defaults,coins:legacy,totalCoins:legacy,totalTaps:legacy,bestCombo:Number(old.best||1),up:{...defaults.up}}}
s.up={...defaults.up,...(s.up||{})}; let combo=1,lastTap=0,comboTimer;
const upgrades=[
 {id:'power',icon:'👆',name:'Сила тапа',desc:'+1 монета за каждый тап',base:35,grow:1.62,currency:'coin'},
 {id:'auto',icon:'⚙️',name:'Автотап',desc:'+1 монета в секунду',base:120,grow:1.72,currency:'coin'},
 {id:'combo',icon:'🔥',name:'Комбо-усилитель',desc:'+10% бонуса от серии',base:220,grow:1.78,currency:'coin'},
 {id:'crit',icon:'💥',name:'Критический тап',desc:'+3% шанс получить ×5',base:400,grow:1.85,currency:'coin',max:15},
 {id:'starLuck',icon:'⭐',name:'Звёздная удача',desc:'+1% шанс получить ⭐1 за тап',base:25,grow:1.55,currency:'star',max:12},
 {id:'offline',icon:'🌙',name:'Копилка',desc:'+10% к пассивному доходу',base:650,grow:1.8,currency:'coin',max:20}
];
function stars(){try{const x=JSON.parse(localStorage.getItem(STAR)||'null');if(typeof x==='number')return x;if(x&&typeof x.balance==='number')return x.balance}catch(e){}return Number(localStorage.getItem('rndmStars')||0)}
function setStars(n){n=Math.max(0,Math.floor(n));localStorage.setItem(STAR,JSON.stringify({balance:n,updated:Date.now()}));localStorage.setItem('rndmStars',String(n))}
function save(){s.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(s))}
const power=()=>1+s.up.power;
const auto=()=>s.up.auto*(1+s.up.offline*.1);
const critChance=()=>Math.min(.5,.05+s.up.crit*.03);
const starChance=()=>Math.min(.2,.01+s.up.starLuck*.01);
const cost=u=>Math.floor(u.base*Math.pow(u.grow,s.up[u.id]));
function evo(){const t=s.totalCoins; if(t>=50000)return {n:5,name:'Космический кот',emoji:'😼',min:50000,next:150000};if(t>=15000)return {n:4,name:'Кибер-кот',emoji:'😺',min:15000,next:50000};if(t>=4000)return {n:3,name:'Король котов',emoji:'😸',min:4000,next:15000};if(t>=500)return {n:2,name:'Прокачанный кот',emoji:'😻',min:500,next:4000};return {n:1,name:'Домашний котик',emoji:'🐱',min:0,next:500}}
function level(){return Math.max(1,Math.floor(Math.sqrt(s.totalCoins/75))+1)}
function renderUpgrades(){const g=$('#upgradeGrid');g.innerHTML='';upgrades.forEach(u=>{const lv=s.up[u.id],maxed=u.max&&lv>=u.max,c=maxed?0:cost(u),can=u.currency==='star'?stars()>=c:s.coins>=c;const el=document.createElement('article');el.className='upgrade-card';el.innerHTML=`<div class="upgrade-icon">${u.icon}</div><div class="upgrade-info"><div class="upgrade-title"><b>${u.name}</b><span>LVL ${lv}${u.max?' / '+u.max:''}</span></div><p>${u.desc}</p><button class="upgrade-buy ${can?'ready':''}" ${maxed?'disabled':''}>${maxed?'МАКСИМУМ':(u.currency==='star'?'⭐ ':'🪙 ')+c}</button></div>`;el.querySelector('button').onclick=()=>buy(u);g.appendChild(el)})}
function draw(){const e=evo(),span=e.next-e.min,progress=Math.max(0,Math.min(1,(s.totalCoins-e.min)/span));$('#catCoins').textContent=Math.floor(s.coins).toLocaleString('ru-RU');$('#catPerTap').textContent='+'+power();$('#catPerSec').textContent=auto().toFixed(auto()%1?1:0)+'/с';$('#catStars').textContent='⭐ '+stars();$('#catCombo').textContent='x'+combo;$('#catCrit').textContent=Math.round(critChance()*100)+'%';$('#catBonus').textContent=Math.round(starChance()*100)+'%';$('#catRank').textContent=e.name;$('#catEvolution').textContent='Эволюция '+e.n;$('#catLevel').textContent=level();$('#catEmoji').textContent=e.emoji;$('#catNextEvolution').textContent=e.n===5?'Максимальная форма':Math.max(0,e.next-s.totalCoins).toLocaleString('ru-RU')+' монет';$('#catEvolutionBar').style.width=(e.n===5?100:progress*100)+'%';renderUpgrades()}
function gain(n,msg){s.coins+=n;s.totalCoins+=n;if(msg)$('#catMessage').textContent=msg;save();draw()}
function buy(u){const lv=s.up[u.id];if(u.max&&lv>=u.max)return;const c=cost(u);if(u.currency==='star'){if(stars()<c){$('#catMessage').textContent='Не хватает ⭐ звёзд.';return}setStars(stars()-c)}else{if(s.coins<c){$('#catMessage').textContent='Не хватает 🪙 монет.';return}s.coins-=c}s.up[u.id]++;$('#catMessage').textContent=`${u.icon} ${u.name} улучшено до ${s.up[u.id]} уровня!`;save();draw()}
$('#catTap').onclick=()=>{const now=Date.now();combo=now-lastTap<650?Math.min(combo+1,25):1;lastTap=now;clearTimeout(comboTimer);comboTimer=setTimeout(()=>{combo=1;draw()},900);s.bestCombo=Math.max(s.bestCombo,combo);s.totalTaps++;let amount=power();amount+=Math.floor(amount*(combo-1)*(.04+s.up.combo*.1));let crit=Math.random()<critChance();if(crit)amount*=5;let star=Math.random()<starChance();if(star)setStars(stars()+1);s.coins+=amount;s.totalCoins+=amount;const p=$('#catPop');p.textContent='+'+amount+(crit?' 💥':'')+(star?' ⭐':'');p.classList.remove('show');void p.offsetWidth;p.classList.add('show');$('#catTap').classList.add('tap');setTimeout(()=>$('#catTap').classList.remove('tap'),90);$('#catMessage').textContent=crit?'КРИТ! ×5 монет!':star?'Звёздный тап! Получена ⭐1':'Комбо x'+combo+' • ещё!';save();draw()};
$('#catReset').onclick=()=>{if(confirm('Полностью сбросить монеты и улучшения котика? Звёзды RNDM не будут удалены.')){s=JSON.parse(JSON.stringify(defaults));save();combo=1;draw();$('#catMessage').textContent='Прогресс котика сброшен.'}};
let prev=Date.now();setInterval(()=>{const now=Date.now(),sec=(now-prev)/1000;prev=now;const a=auto();if(a>0){const n=a*sec;s.coins+=n;s.totalCoins+=n;save();draw()}},1000);
window.addEventListener('beforeunload',save);draw();
})();
