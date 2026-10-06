(() => {
  const KEY="cj:observability";
  const MAX=80;
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x:[]}catch{return []}}
  function event(name,context={}){
    const row={name,at:Date.now(),path:location.pathname,context};
    try{localStorage.setItem(KEY,JSON.stringify([...read(),row].slice(-MAX)))}catch{}
    const endpoint=window.CHAMPION_JOURNEY_BACKEND?.telemetryEndpoint;
    if(endpoint){
      try{navigator.sendBeacon(endpoint,new Blob([JSON.stringify(row)],{type:"application/json"}))}catch{}
    }
  }
  addEventListener("error",e=>event("runtime_error",{message:String(e.message||"").slice(0,180),file:String(e.filename||"").split("/").pop(),line:e.lineno||0}));
  addEventListener("unhandledrejection",e=>event("unhandled_rejection",{message:String(e.reason?.message||e.reason||"").slice(0,180)}));
  addEventListener("load",()=>{
    const nav=performance.getEntriesByType?.("navigation")?.[0];
    if(nav)event("page_load",{duration:Math.round(nav.duration||0),transferSize:Number(nav.transferSize||0)});
  },{once:true});
  window.CJ_OBS={event,read,clear:()=>localStorage.removeItem(KEY)};
})();