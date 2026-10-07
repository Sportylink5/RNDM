// RNDM v26.4 PERFORMANCE + UX
(()=>{
'use strict';
const d=document,w=window;
const sameOrigin=u=>{try{return new URL(u,location.href).origin===location.origin}catch{return false}};

// Lightweight top progress: gives immediate feedback instead of a frozen-looking page.
const bar=d.createElement('div');bar.className='rndm-perf-progress';bar.setAttribute('aria-hidden','true');d.documentElement.appendChild(bar);
requestAnimationFrame(()=>bar.classList.add('go'));
w.addEventListener('load',()=>{bar.classList.add('done');setTimeout(()=>bar.remove(),350)},{once:true});

// Network state indicator. Only shown when it matters.
const net=d.createElement('div');net.className='rndm-network-state';net.setAttribute('role','status');d.body.appendChild(net);
function networkState(){
  if(!navigator.onLine){net.textContent='Нет сети · данные из кэша';net.classList.add('show','offline');return}
  const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(c&&(c.saveData||/^(slow-2g|2g)$/.test(c.effectiveType||''))){net.textContent='Медленное соединение';net.classList.add('show');setTimeout(()=>net.classList.remove('show'),3500)}
  else net.classList.remove('show','offline');
}
w.addEventListener('online',networkState);w.addEventListener('offline',networkState);navigator.connection?.addEventListener?.('change',networkState);networkState();

// Lazy media. Existing visible/critical media stays eager; off-screen media waits.
function optimizeMedia(root=d){
  root.querySelectorAll?.('img:not([loading])').forEach((img,i)=>{img.loading=i<3?'eager':'lazy';img.decoding='async';if(i>=3)img.fetchPriority='low'});
  root.querySelectorAll?.('video').forEach(v=>{if(!v.hasAttribute('preload'))v.preload='metadata';if(!v.hasAttribute('playsinline'))v.setAttribute('playsinline','')});
}
optimizeMedia();
const mo=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.nodeType===1)optimizeMedia(n)});mo.observe(d.body,{childList:true,subtree:true});

// Warm likely next page only when the user shows intent; avoids downloading the whole site up front.
const warmed=new Set();
function warm(a){
  if(!a||!a.href||!sameOrigin(a.href))return;
  const u=new URL(a.href);if(u.pathname===location.pathname||warmed.has(u.href))return;
  warmed.add(u.href);
  const l=d.createElement('link');l.rel='prefetch';l.href=u.href;l.as='document';d.head.appendChild(l);
}
d.addEventListener('pointerover',e=>{const a=e.target.closest?.('a[href]');if(a)warm(a)},{passive:true});
d.addEventListener('touchstart',e=>{const a=e.target.closest?.('a[href]');if(a)warm(a)},{passive:true});

// Mark navigation immediately, while keeping normal browser/BFCache behavior.
d.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.button>0||a.target==='_blank'||!sameOrigin(a.href))return;bar?.classList.remove('done');bar?.classList.add('go','nav')});
w.addEventListener('pageshow',e=>{if(e.persisted)d.body.classList.add('rndm-bfcache-restored')});

// Pause decorative videos when the app is backgrounded; saves CPU/battery on mobile.
d.addEventListener('visibilitychange',()=>{if(d.hidden)d.querySelectorAll('video').forEach(v=>{if(!v.paused){v.dataset.rndmResume='1';v.pause()}});else d.querySelectorAll('video[data-rndm-resume="1"]').forEach(v=>{delete v.dataset.rndmResume;v.play().catch(()=>{})})});

// Schedule non-critical maintenance after first paint.
const idle=w.requestIdleCallback||((fn)=>setTimeout(fn,800));
idle(()=>{try{w.RNDMCloud?.heartbeat?.()}catch{}},{timeout:2500});
})();
