const CACHE='rndm-v26-5-performance-shell';
const CORE=[
  './','./index.html','./profile.html','./chat.html','./clips.html',
  './rndm-shell.css?v=26.5','./rndm-v26.css?v=26.5',
  './rndm-shell.js?v=26.5','./rndm-v26.js?v=26.5','./rndm-v26-extra.js?v=26.5','./rndm-performance.js?v=26.5',
  './rndm-cloud.js?v=26.5','./rndm-censor.js?v=26.5','./rndm-state-sync.js?v=26.5',
  './rndm-legacy-app.js?v=26.5','./rndm-legacy-v13.js?v=26.5','./rndm-legacy-v15.js?v=26.5',
  './icon-192.svg','./icon-512.svg','./manifest.webmanifest'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; // API/Supabase/CDN always direct.
  if(e.request.mode==='navigate'){
    // Instant repeat navigation: cached page now, refresh cache in background.
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE),hit=await cache.match(e.request);
      const fresh=fetch(e.request).then(r=>{if(r?.ok)cache.put(e.request,r.clone());return r}).catch(()=>null);
      if(hit){e.waitUntil(fresh);return hit}
      return (await fresh)||cache.match('./index.html');
    })());return;
  }
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|gif|avif|webmanifest)$/i.test(url.pathname)){
    e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(e.request);if(hit)return hit;const r=await fetch(e.request);if(r?.ok)cache.put(e.request,r.clone());return r})());
  }
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow('./activity.html'))});
