const CACHE='rndm-v27-7-recovery';
const CORE=[
  './','./index.html','./profile.html','./reset-password.html','./chat.html','./clips.html',
  './rndm-shell.css?v=27.7','./rndm-v26.css?v=27.7',
  './rndm-shell.js?v=27.7','./rndm-v26.js?v=27.7','./rndm-v26-extra.js?v=27.7','./rndm-performance.js?v=27.7',
  './rndm-cloud.js?v=27.7','./rndm-censor.js?v=27.7','./rndm-state-sync.js?v=27.7',
  './rndm-legacy-app.js?v=27.7','./rndm-legacy-v13.js?v=27.7','./rndm-legacy-v15.js?v=27.7',
  './rndm-v27.css?v=27.7','./rndm-v27.js?v=27.7','./rndm-repair-v276.js?v=27.7','./rndm-profile-v272.js?v=27.7','./communities.html','./voice.html','./apps.html','./security.html','./icon-192.svg','./icon-512.svg','./manifest.webmanifest'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; // API/Supabase/CDN always direct.
  if(e.request.mode==='navigate'){
    // v27.7: network-first prevents old HTML from mixing with new JS after releases.
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{const r=await fetch(e.request);if(r?.ok)await cache.put(e.request,r.clone());return r}
      catch{return (await cache.match(e.request))||(await cache.match('./index.html'))}
    })());return;
  }
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|gif|avif|webmanifest)$/i.test(url.pathname)){
    e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r?.ok)cache.put(e.request,r.clone());return r})());
  }
});
self.addEventListener('push',e=>{let d={};try{d=e.data?.json?.()||{}}catch{d={body:e.data?.text?.()||''}};const title=d.title||'RNDM';const opts={body:d.body||'',icon:'./icon-192.svg',badge:'./icon-192.svg',data:{link:d.link||'./activity.html'}};e.waitUntil(self.registration.showNotification(title,opts))});
self.addEventListener('notificationclick',e=>{e.notification.close();const link=e.notification?.data?.link||'./activity.html';e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if('focus'in w){w.navigate?.(link);return w.focus()}}return clients.openWindow(link)}))});
