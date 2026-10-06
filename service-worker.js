const CACHE="cj-v3";
const CORE=["./","./index.html","./style.css","./app.js","./i18n.js","./backend-config.js","./observability.js","./manifest.webmanifest","./icon.svg","./privacy.html"];

const normalizedRequest=request=>{
  const url=new URL(request.url);
  url.search="";
  return new Request(url.toString(),{
    method:"GET",
    headers:request.headers,
    mode:request.mode==="navigate"?"same-origin":request.mode,
    credentials:request.credentials,
    redirect:"follow"
  });
};

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET")return;
  if(url.pathname.endsWith("/version.json")||url.hostname.includes("supabase.co")||url.hostname.includes("riotgames.com"))return;

  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok&&url.origin===self.location.origin){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(normalizedRequest(event.request),copy));
      }
      return response;
    }).catch(async()=>{
      const cached=await caches.match(event.request,{ignoreSearch:true});
      if(cached)return cached;
      if(event.request.mode==="navigate")return caches.match("./index.html",{ignoreSearch:true});
      return Response.error();
    })
  );
});
