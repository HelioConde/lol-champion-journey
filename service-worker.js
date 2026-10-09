// Champion Journey shares the helioconde.github.io origin with other apps.
// Never cache a Riot ID query, a profile response or another app's URLs.
const CACHE="cj-v4";
const CORE=["./","./index.html","./style.css","./app.js","./i18n.js",
"./backend-config.js","./observability.js","./manifest.webmanifest",
"./icon.svg","./icon-maskable.svg","./privacy.html","./live-update.js"];
const SCOPE=new URL(self.registration.scope);
const SHELL_PATHS=new Set(CORE.map(file=>new URL(file,self.registration.scope).pathname));

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>/^cj-v\d+$/.test(key)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;

  const navigation=request.mode==="navigate";
  const cacheable=!url.search&&SHELL_PATHS.has(url.pathname);
  if(!cacheable&&!navigation)return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request);
      if(cacheable&&response.ok&&response.type==="basic"){
        await cache.put(request,response.clone());
      }
      return response;
    }catch{
      if(cacheable){
        const cached=await cache.match(request);
        if(cached)return cached;
      }
      if(navigation){
        const pathname=SHELL_PATHS.has(url.pathname)?url.pathname:new URL("./index.html",SCOPE).pathname;
        const shell=await cache.match(SCOPE.origin+pathname);
        if(shell)return shell;
      }
      return Response.error();
    }
  })());
});
