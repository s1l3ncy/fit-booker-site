const CACHE='probe-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  e.respondWith((async()=>{ try{ return await fetch(r,{cache:'no-store'}); }
    catch(err){ const c=await caches.match(r); if(c)return c; throw err; } })());
});
