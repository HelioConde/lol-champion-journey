const CACHE="cj-v2";
const CORE=["./","./index.html","./style.css","./app.js","./i18n.js","./backend-config.js","./observability.js","./manifest.webmanifest","./icon.svg","./privacy.html"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.pathname.endsWith("/version.json")||u.hostname.includes("supabase.co")||u.hostname.includes("riotgames.com"))return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r.ok&&u.origin===location.origin){
        const copy=r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
      }
      return r;
    }).catch(async()=>{
      const cached=await caches.match(e.request);
      if(cached)return cached;
      if(e.request.mode==="navigate")return caches.match("./index.html");
      return Response.error();
    })
  );
});
