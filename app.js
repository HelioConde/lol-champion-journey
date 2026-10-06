(() => {
  const $ = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const state = { lang: localStorage.getItem("cj:lang") || "pt-BR", profile:null, champions:[], selected:0, demo:false, snapshots:[] };
  const regions = {br1:"americas",na1:"americas",la1:"americas",la2:"americas",oc1:"sea",euw1:"europe",eun1:"europe",tr1:"europe",ru:"europe",kr:"asia",jp1:"asia",sg2:"sea",ph2:"sea",tw2:"sea",th2:"sea",vn2:"sea"};
  const demo = {
    player:{gameName:"JourneyPlayer",tagLine:"BR1",level:214,platform:"BR1"},
    summary:{matches:20,wins:12,losses:8,winRate:60,primaryPosition:"MID"},
    championSummaries:[
      {name:"Ahri",games:8,avgKda:4.1},{name:"Lux",games:5,avgKda:3.4},{name:"Jinx",games:4,avgKda:2.8},{name:"Thresh",games:3,avgKda:3.1}
    ],
    mastery:[
      {championName:"Ahri",championId:103,level:7,points:684220},
      {championName:"Lux",championId:99,level:7,points:291445},
      {championName:"Jinx",championId:222,level:6,points:173904}
    ],
    matches:Array.from({length:20},(_,i)=>({playedAt:Date.now()-(19-i)*86400000,position:i<13?"MID":"ADC"}))
  };

  function t(key, vars={}) {
    let v=(window.CJ_I18N[state.lang]||window.CJ_I18N["pt-BR"])[key]||key;
    Object.entries(vars).forEach(([k,val])=>v=v.replaceAll("{"+k+"}",val));
    return v;
  }
  function setLang(lang){
    state.lang=lang; localStorage.setItem("cj:lang",lang);
    document.documentElement.lang=lang; qsa("[data-language]").forEach(b=>b.classList.toggle("is-active",b.dataset.language===lang));
    qsa("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
    if(state.profile) renderProfile();
  }
  const fmt = n => Number(n||0).toLocaleString(state.lang==="pt-BR"?"pt-BR":"en-US");
  const esc = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const slug = name => name.replace(/[^A-Za-z0-9]/g,"");
  let ddragonCatalog=null;
  async function loadDDragonCatalog(){
    if(ddragonCatalog)return ddragonCatalog;
    try{
      const realm=await fetch("https://ddragon.leagueoflegends.com/realms/br.json",{cache:"force-cache"}).then(r=>r.ok?r.json():Promise.reject());
      const version=realm?.n?.champion||realm?.v;
      const data=await fetch("https://ddragon.leagueoflegends.com/cdn/"+version+"/data/pt_BR/champion.json",{cache:"force-cache"}).then(r=>r.ok?r.json():Promise.reject());
      const byName={},byId={};
      Object.values(data?.data||{}).forEach(ch=>{
        byName[String(ch.name||"").toLowerCase()]={key:Number(ch.key),id:ch.id,name:ch.name};
        byId[Number(ch.key)]={key:Number(ch.key),id:ch.id,name:ch.name};
      });
      ddragonCatalog={byName,byId};
    }catch{
      ddragonCatalog={byName:{},byId:{}};
    }
    return ddragonCatalog;
  }
  const championAssetId = name => ddragonCatalog?.byName?.[String(name||"").toLowerCase()]?.id || slug(name);
  const splash = name => "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"+championAssetId(name)+"_0.jpg";

  function saveRecent(gameName,tagLine,server){
    const key="cj:recent"; let list=[]; try{list=JSON.parse(localStorage.getItem(key)||"[]")}catch{}
    list=[{gameName,tagLine,server},...list.filter(x=>!(x.gameName.toLowerCase()===gameName.toLowerCase()&&x.tagLine.toLowerCase()===tagLine.toLowerCase()))].slice(0,5);
    localStorage.setItem(key,JSON.stringify(list)); renderRecent();
  }
  function renderRecent(){
    let list=[]; try{list=JSON.parse(localStorage.getItem("cj:recent")||"[]")}catch{}
    $("#recent-searches").hidden=!list.length;
    $("#recent-searches-list").innerHTML=list.map((x,i)=>'<button class="recent-search" data-i="'+i+'"><b>'+esc(x.gameName)+"#"+esc(x.tagLine)+'</b><span>'+esc(x.server.toUpperCase())+'</span></button>').join("");
    qsa(".recent-search").forEach((b,i)=>b.onclick=()=>loadProfile(list[i].gameName,list[i].tagLine,list[i].server));
  }

  async function fetchProfile(gameName,tagLine,server){
    const endpoint=window.CHAMPION_JOURNEY_BACKEND?.lolProfile;
    if(!endpoint) throw Object.assign(new Error("backend"),{status:0});
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),16000);
    try{
      const res=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},signal:controller.signal,body:JSON.stringify({
        gameName,tagLine,platform:server,region:regions[server]||"americas",limit:100,matchLimit:100,historyDepth:100
      })});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw Object.assign(new Error(data?.message||("http_"+res.status)),{status:res.status,data});
      return data;
    }finally{clearTimeout(timer)}
  }

  function setLoading(active,refresh=false){
    document.body.classList.toggle("is-loading",active);
    const submit=$("#search-form button[type='submit']");
    const refreshButton=$("#refresh-data");
    if(submit)submit.disabled=active;
    if(refreshButton)refreshButton.disabled=active;
    if(active)$("#search-status").textContent=t(refresh?"loadingMore":"loading");
  }

  async function loadProfile(gameName,tagLine,server,refresh=false){
    setLoading(true,refresh);
    try{
      const data=await fetchProfile(gameName,tagLine,server);
      if(!data?.championSummaries?.length) throw Object.assign(new Error("empty"),{status:204});
      state.profile=data; state.demo=false;
      $("#search-status").textContent="";
      window.CJ_OBS?.event("riot_lookup_success",{server,matches:Number(data?.summary?.matches||0),champions:Number(data?.championSummaries?.length||0)});
    }catch(e){
      state.profile={...demo,player:{...demo.player,gameName,tagLine,platform:server.toUpperCase()}}; state.demo=true;
      $("#search-status").textContent=e?.status===429?t("rateLimit"):e?.status===404||e?.data?.riotStatus===404?t("notFound"):e?.status>=500||e?.status===0?t("backendError"):t("fallback");
      window.CJ_OBS?.event("riot_lookup_fallback",{server,status:Number(e?.status||0),reason:String(e?.message||"unknown").slice(0,100)});
    }finally{setLoading(false,refresh)}
    state.selected=0;
    await loadDDragonCatalog();
    prepareChampions();
    saveSnapshot();
    saveRecent(gameName,tagLine,server);
    const url=new URL(location.href);
    url.searchParams.set("riotId",gameName+"#"+tagLine);
    url.searchParams.set("server",server);
    url.searchParams.set("lang",state.lang);
    history.replaceState(null,"",url.pathname+"?"+url.searchParams.toString());
    $("#landing-view").hidden=true; $("#profile-view").hidden=false; window.scrollTo({top:0,behavior:refresh?"smooth":"auto"});
    renderProfile();
    loadRemoteSnapshots().then(changed=>{if(changed&&state.profile)renderProfile()});
  }

  function snapshotKey(profile=state.profile){
    const player=profile?.player||{};
    return "cj:snapshots:"+[String(player.gameName||"").toLowerCase(),String(player.tagLine||"").toLowerCase(),String(player.platform||"").toLowerCase()].join(":");
  }
  function readSnapshots(profile=state.profile){
    try{
      const raw=JSON.parse(localStorage.getItem(snapshotKey(profile))||"[]");
      return Array.isArray(raw)?raw:[];
    }catch{return []}
  }
  async function loadRemoteSnapshots(){
    const endpoint=window.CHAMPION_JOURNEY_BACKEND?.snapshotHistory;
    if(!endpoint||state.demo||!state.profile)return false;
    const p=state.profile.player||{};
    try{
      const res=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        gameName:p.gameName,tagLine:p.tagLine,platform:String(p.platform||"").toLowerCase(),limit:24
      })});
      if(!res.ok)return false;
      const data=await res.json();
      const remote=Array.isArray(data?.snapshots)?data.snapshots:[];
      if(!remote.length)return false;
      const local=readSnapshots();
      const merged=[...local,...remote]
        .filter(x=>x&&Number(x.capturedAt)>0)
        .sort((a,b)=>Number(a.capturedAt)-Number(b.capturedAt))
        .filter((x,i,arr)=>i===0||Number(x.capturedAt)!==Number(arr[i-1].capturedAt))
        .slice(-24);
      localStorage.setItem(snapshotKey(),JSON.stringify(merged));
      state.snapshots=merged;
      window.CJ_OBS?.event("snapshot_history_loaded",{count:remote.length});
      return true;
    }catch{return false}
  }
  function buildSnapshot(){
    if(!state.profile||state.demo||!state.champions.length)return null;
    return {
      capturedAt:Date.now(),
      sampleMatches:Number(state.profile.summary?.matches||0),
      signature:state.champions[0]?.name||null,
      champions:state.champions.slice(0,12).map(c=>({
        name:c.name,
        games:Number(c.games||0),
        avgKda:Number(c.avgKda||0),
        masteryPoints:Number(c.masteryPoints||0),
        masteryLevel:Number(c.masteryLevel||0)
      }))
    };
  }
  function saveSnapshot(){
    const snap=buildSnapshot();
    if(!snap)return;
    const key=snapshotKey();
    const list=readSnapshots();
    const previous=list[list.length-1];
    const sameSample=previous &&
      previous.sampleMatches===snap.sampleMatches &&
      previous.signature===snap.signature &&
      JSON.stringify(previous.champions)===JSON.stringify(snap.champions);
    if(!sameSample){
      const next=[...list,snap].slice(-24);
      localStorage.setItem(key,JSON.stringify(next));
      state.snapshots=next;
    }else{
      state.snapshots=list;
    }
  }
  function signed(value,digits=0){
    const n=Number(value||0);
    if(Math.abs(n)<Math.pow(10,-digits)/2)return "0";
    return (n>0?"+":"")+n.toFixed(digits);
  }
  function deltaClass(n){
    n=Number(n||0);
    return n>0?"delta-positive":n<0?"delta-negative":"delta-neutral";
  }
  function snapshotScore(snapshot,c){
    const rows=snapshot?.champions||[], row=rows.find(x=>x.name===c.name);
    if(!row)return 0;
    const maxGames=Math.max(...rows.map(x=>Number(x.games||0)),1);
    const maxMastery=Math.max(...rows.map(x=>Number(x.masteryPoints||0)),1);
    const presence=Number(row.games||0)/maxGames;
    const performance=Math.min(Number(row.avgKda||0)/5,1);
    const mastery=Number(row.masteryPoints||0)/maxMastery;
    return Math.round((presence*.5+performance*.3+mastery*.2)*100);
  }
  function renderJourneySignals(){
    const host=$("#journey-signals");
    if(state.snapshots.length<2){host.hidden=true;host.innerHTML="";return}
    const curr=state.snapshots[state.snapshots.length-1],prev=state.snapshots[state.snapshots.length-2];
    const prevMap=new Map((prev.champions||[]).map(x=>[x.name,Number(x.games||0)]));
    const currMap=new Map((curr.champions||[]).map(x=>[x.name,Number(x.games||0)]));
    const rises=(curr.champions||[]).map(x=>({name:x.name,delta:Number(x.games||0)-(prevMap.get(x.name)||0)})).sort((a,b)=>b.delta-a.delta);
    const rising=rises.find(x=>x.delta>0);
    const left=(prev.champions||[]).find(x=>(x.games||0)>0&&!currMap.has(x.name));
    const mainChanged=curr.signature!==prev.signature;
    const cards=[
      [mainChanged?t("signalMainChanging"):t("signalMainStable"),mainChanged?t("signalMainChangingText",{old:prev.signature||"—",name:curr.signature||"—"}):t("signalMainStableText",{name:curr.signature||"—"})]
    ];
    if(rising)cards.push([t("signalRising"),t("signalRisingText",{name:rising.name,delta:rising.delta})]);
    if(left)cards.push([t("signalLeftSample"),t("signalLeftSampleText",{name:left.name})]);
    host.hidden=false;
    host.innerHTML=cards.map(([a,b])=>'<article><b>'+esc(a)+'</b><p>'+esc(b)+'</p></article>').join("");
  }
  function renderSnapshotHistory(c){
    const host=$("#snapshot-history"),bars=$("#history-bars"),select=$("#history-metric");
    if(state.snapshots.length<2){host.hidden=true;bars.innerHTML="";return}
    const usable=state.snapshots.slice(-12);
    const df=new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short"});
    const metric=select?.value||"connection";
    const rows=usable.map(s=>{
      const row=(s.champions||[]).find(x=>x.name===c.name)||{};
      const value=metric==="kda"?Number(row.avgKda||0):metric==="mastery"?Number(row.masteryPoints||0):metric==="games"?Number(row.games||0):snapshotScore(s,c);
      return {snapshot:s,value};
    });
    const max=Math.max(...rows.map(x=>x.value),metric==="connection"?100:1);
    host.hidden=false;
    $("#history-range").textContent=df.format(new Date(usable[0].capturedAt))+" → "+df.format(new Date(usable[usable.length-1].capturedAt));
    bars.innerHTML=rows.map(({snapshot:s,value})=>{
      const date=df.format(new Date(s.capturedAt));
      const h=metric==="connection"?Math.max(4,value):Math.max(4,Math.round(value/max*100));
      const label=metric==="mastery"?fmt(value):metric==="kda"?value.toFixed(1):String(Math.round(value));
      return '<div class="history-bar" title="'+esc(date+" · "+label)+'"><i style="--h:'+h+'%"></i><span>'+esc(label)+'</span><small>'+esc(date)+'</small></div>';
    }).join("");
    if(select)select.onchange=()=>renderSnapshotHistory(c);
  }
  function renderSnapshotComparison(c){
    state.snapshots=readSnapshots();
    $("#snapshot-count").textContent=state.snapshots.length+" snapshot"+(state.snapshots.length===1?"":"s");
    const empty=$("#snapshot-empty"), grid=$("#snapshot-comparison");
    if(state.snapshots.length<2){
      empty.hidden=false; grid.hidden=true; renderJourneySignals(); renderSnapshotHistory(c); return;
    }
    empty.hidden=true; grid.hidden=false;
    const curr=state.snapshots[state.snapshots.length-1], prev=state.snapshots[state.snapshots.length-2];
    renderJourneySignals();
    const currChampion=curr.champions.find(x=>x.name===c.name)||{games:0,avgKda:0,masteryPoints:0};
    const prevChampion=prev.champions.find(x=>x.name===c.name)||{games:0,avgKda:0,masteryPoints:0};

    const signatureChanged=curr.signature!==prev.signature;
    $("#delta-signature").textContent=curr.signature||"—";
    $("#delta-signature").className=signatureChanged?"delta-positive":"delta-neutral";
    $("#delta-signature-note").textContent=signatureChanged?t("newChampion",{old:prev.signature||"—"}):t("sameChampion");

    const gamesDelta=currChampion.games-prevChampion.games;
    $("#delta-games").textContent=signed(gamesDelta);
    $("#delta-games").className=deltaClass(gamesDelta);
    $("#delta-games-note").textContent=t("sinceLast");

    const kdaDelta=currChampion.avgKda-prevChampion.avgKda;
    $("#delta-kda").textContent=signed(kdaDelta,1);
    $("#delta-kda").className=deltaClass(kdaDelta);
    $("#delta-kda-note").textContent=t("sinceLast");

    const masteryDelta=currChampion.masteryPoints-prevChampion.masteryPoints;
    $("#delta-mastery").textContent=(masteryDelta>0?"+":"")+fmt(masteryDelta);
    $("#delta-mastery").className=deltaClass(masteryDelta);
    $("#delta-mastery-note").textContent=t("sinceLast");
    renderSnapshotHistory(c);
  }

  function prepareChampions(){
    const p=state.profile||demo;
    const mastery=p.mastery||[];
    state.champions=(p.championSummaries||[]).map(c=>{
      const meta=ddragonCatalog?.byName?.[String(c.name||"").toLowerCase()];
      const m=mastery.find(x=>{
        if(x.championName&&String(x.championName).toLowerCase()===String(c.name).toLowerCase())return true;
        return meta?.key&&Number(x.championId)===Number(meta.key);
      });
      return {...c,championId:meta?.key||null,assetId:meta?.id||slug(c.name),masteryPoints:m?.points||0,masteryLevel:m?.level||0};
    }).sort((a,b)=>(b.games||0)-(a.games||0));
  }
  function championConsistency(c){
    const values=(state.profile?.matches||[])
      .filter(m=>String(m.champion||"").toLowerCase()===String(c.name||"").toLowerCase())
      .map(m=>Number(m.kda))
      .filter(Number.isFinite);
    if(values.length<2)return 50;
    const mean=values.reduce((a,b)=>a+b,0)/values.length;
    const variance=values.reduce((s,v)=>s+Math.pow(v-mean,2),0)/values.length;
    const deviation=Math.sqrt(variance);
    const cv=deviation/Math.max(.5,mean);
    return Math.round(Math.max(0,1-Math.min(1,cv))*100);
  }
  function scoreComponents(c){
    const maxGames=Math.max(...state.champions.map(x=>x.games||0),1);
    const maxMastery=Math.max(...state.champions.map(x=>x.masteryPoints||0),1);
    const kda=Math.min(Number(c.avgKda||0)/5,1);
    const wr=Number(c.winRate);
    const winRate=Number.isFinite(wr)?Math.max(0,Math.min(1,wr/100)):null;
    const performance=winRate==null?kda:(kda*.6+winRate*.4);
    return {
      presence:Math.round(((c.games||0)/maxGames)*100),
      performance:Math.round(performance*100),
      mastery:Math.round(((c.masteryPoints||0)/maxMastery)*100),
      consistency:championConsistency(c)
    };
  }
  function connectionScore(c){
    const x=scoreComponents(c);
    return Math.round(x.presence*.4+x.performance*.25+x.mastery*.2+x.consistency*.15);
  }
  function championMatchFacts(c){
    const matches=(state.profile?.matches||[]).filter(m=>String(m.champion||"").toLowerCase()===String(c.name||"").toLowerCase());
    const sr=matches.filter(m=>["RANKED","NORMAL"].includes(String(m.context||"").toUpperCase()));
    const avg=(arr,key)=>arr.length?arr.reduce((s,x)=>s+Number(x[key]||0),0)/arr.length:null;
    const bestKda=matches.length?Math.max(...matches.map(m=>Number(m.kda)).filter(Number.isFinite)):null;
    let streak="—";
    if(matches.length){
      const first=!!matches[0].win;
      let count=0;
      for(const m of matches){if(!!m.win!==first)break;count++}
      streak=(first?"W":"L")+count;
    }
    return {
      winRate:Number.isFinite(Number(c.winRate))?Number(c.winRate):null,
      damage:Number.isFinite(Number(c.avgDamagePerMin))?Number(c.avgDamagePerMin):avg(matches,"damagePerMin"),
      cs:avg(sr,"csPerMin"),
      contexts:Array.isArray(c.contexts)?c.contexts:[...new Set(matches.map(m=>m.context).filter(Boolean))],
      bestKda:Number.isFinite(bestKda)?bestKda:null,
      streak
    };
  }
  function renderChampionFacts(c){
    const f=championMatchFacts(c);
    const items=[
      [t("metricWinRate"),f.winRate==null?"—":Math.round(f.winRate)+"%"],
      [t("metricDamage"),f.damage==null?"—":fmt(Math.round(f.damage))],
      [t("metricCs"),f.cs==null?"—":f.cs.toFixed(1)],
      [t("metricBestKda"),f.bestKda==null?"—":f.bestKda.toFixed(1)],
      [t("metricStreak"),f.streak],
      [t("metricContexts"),f.contexts?.length?f.contexts.join(" · "):"—"]
    ];
    $("#champion-facts").innerHTML=items.map(([label,value])=>'<article><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></article>').join("");
  }
  function renderComparison(c){
    const select=$("#compare-select"), others=state.champions.filter(x=>x.name!==c.name);
    if(!others.length){select.innerHTML="";$("#champion-comparison").innerHTML="";return}
    const prior=select.value;
    select.innerHTML=others.map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join("");
    if(others.some(x=>x.name===prior))select.value=prior;
    const other=others.find(x=>x.name===select.value)||others[0];
    const rows=[
      [t("games"),fmt(c.games),fmt(other.games)],
      ["KDA",Number(c.avgKda||0).toFixed(1),Number(other.avgKda||0).toFixed(1)],
      [t("mastery"),c.masteryPoints?fmt(c.masteryPoints):"—",other.masteryPoints?fmt(other.masteryPoints):"—"],
      [t("metricConnection"),connectionScore(c),connectionScore(other)]
    ];
    $("#champion-comparison").innerHTML='<div class="compare-head"><b>'+esc(c.name)+'</b><span>VS</span><b>'+esc(other.name)+'</b></div>'+rows.map(r=>'<div class="compare-row"><strong>'+esc(r[1])+'</strong><span>'+esc(r[0])+'</span><strong>'+esc(r[2])+'</strong></div>').join("");
    select.onchange=()=>renderComparison(c);
  }
  function updateMeta(c){
    const player=state.profile?.player?.gameName||"Player";
    const title=c.name+" · "+player+" · LoL Champion Journey";
    const desc=t("scoreSummary",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)});
    document.title=title;
    const set=(sel,attr,value)=>{const el=$(sel);if(el)el.setAttribute(attr,value)};
    set('meta[name="description"]',"content",desc);
    set('meta[property="og:title"]',"content",title);
    set('meta[property="og:description"]',"content",desc);
    set('meta[property="og:url"]',"content",location.href);
    set('meta[name="twitter:title"]',"content",title);
    set('meta[name="twitter:description"]',"content",desc);
  }
  function renderProfile(){
    const p=state.profile; if(!p||!state.champions.length)return;
    const c=state.champions[state.selected]||state.champions[0];
    const total=p.summary?.matches||state.champions.reduce((s,x)=>s+(x.games||0),0)||1;
    const maxMastery=Math.max(...state.champions.map(x=>x.masteryPoints||0),1);
    const presence=Math.min(100,Math.round((c.games||0)/total*100));
    const performance=Math.min(100,Math.round((c.avgKda||0)/5*100));
    const mastery=Math.min(100,Math.round((c.masteryPoints||0)/maxMastery*100));
    const score=connectionScore(c);
    const components=scoreComponents(c);
    $("#champion-hero").style.backgroundImage='url("'+splash(c.name)+'")';
    $("#profile-riot-id").textContent=(p.player?.gameName||"Player")+"#"+(p.player?.tagLine||"—");
    $("#data-badge").textContent=state.demo?t("demo"):t("live");
    $("#data-badge").classList.toggle("demo",state.demo);
    $("#sample-note").textContent=state.demo?t("sourceDemo"):t("sourceLive",{n:total});
    $("#champion-name").textContent=c.name;
    $("#champion-story").textContent=t("chapterText",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)});
    $("#metric-games").textContent=fmt(c.games);
    $("#metric-kda").textContent=Number(c.avgKda||0).toFixed(1);
    $("#metric-mastery").textContent=c.masteryPoints?fmt(c.masteryPoints):"—";
    $("#champion-list").innerHTML=state.champions.map((x,i)=>'<button class="champion-chip '+(i===state.selected?"active":"")+'" data-i="'+i+'"><img class="chip-bg" src="'+esc(splash(x.name))+'" alt="" loading="lazy" decoding="async"><span><b>'+esc(x.name)+'</b><small>'+fmt(x.games)+' '+t("games")+'</small></span><strong>'+connectionScore(x)+'</strong></button>').join("");
    qsa(".champion-chip").forEach(b=>b.onclick=()=>{state.selected=Number(b.dataset.i);window.CJ_OBS?.event("champion_selected",{champion:state.champions[state.selected]?.name||null});renderProfile();document.querySelector(".journey-grid").scrollIntoView({behavior:"smooth",block:"start"})});
    $("#chapter-title").textContent=state.selected===0?t("chapterMain"):t("chapterOther");
    $("#chapter-text").textContent=t("chapterText",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)});
    [["presence",presence],["performance",components.performance],["mastery",mastery],["consistency",components.consistency]].forEach(([id,v])=>{$("#"+id+"-label").textContent=v+"%";$("#"+id+"-bar").style.width=v+"%"});
    $("#identity-cards").innerHTML=[
      [t("frequent"),t("frequentText")],[t("performanceTag"),t("performanceText",{kda:Number(c.avgKda||0).toFixed(1)})],[t("masteryTag"),t("masteryText",{points:c.masteryPoints?fmt(c.masteryPoints):"—"})]
    ].map(([a,b])=>'<div><b>'+esc(a)+'</b><p>'+esc(b)+'</p></div>').join("");
    renderChampionFacts(c);
    renderComparison(c);
    $("#formula-explanation").textContent=t("formulaText",{name:c.name,presence:components.presence,performance:components.performance,mastery:components.mastery,consistency:components.consistency,score});
    renderSnapshotComparison(c);
    renderTimeline(c);
    $("#share-title").textContent=c.name+" · "+(p.player?.gameName||"Player");
    $("#share-summary").textContent=t("scoreSummary",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)});
    $("#share-score").textContent=score;
    updateMeta(c);
  }
  function renderTimeline(c){
    const all=state.profile?.matches||[];
    const championMatches=all.filter(m=>String(m.champion||"").toLowerCase()===String(c.name||"").toLowerCase()).slice(0,5);
    const df=new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short"});
    if(championMatches.length){
      $("#journey-timeline").innerHTML=championMatches.map(m=>{
        const when=Number(m.playedAt||m.gameCreation||0);
        const result=m.context==="ARENA"&&m.placement?("#"+m.placement):(m.win?"WIN":"LOSS");
        const kda=Number.isFinite(Number(m.kda))?Number(m.kda).toFixed(1):"—";
        const detail=[m.context,m.position,result,"KDA "+kda].filter(Boolean).join(" · ");
        return '<div class="timeline-item"><span>'+esc(when?df.format(new Date(when)):"—")+'</span><i></i><div><b>'+esc(c.name)+'</b><p>'+esc(detail)+'</p></div></div>';
      }).join("");
      return;
    }
    const dates=all.map(m=>Number(m.playedAt||m.gameCreation||0)).filter(Boolean).sort((a,b)=>a-b);
    const first=dates.length?new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short",year:"numeric"}).format(new Date(dates[0])):"—";
    const now=df.format(new Date());
    const items=[[first,t("timeline1"),t("timeline1Text")],["★",t("timeline2"),t("timeline2Text",{name:c.name})],[now,t("timeline3"),t("timeline3Text")]];
    $("#journey-timeline").innerHTML=items.map(x=>'<div class="timeline-item"><span>'+esc(x[0])+'</span><i></i><div><b>'+esc(x[1])+'</b><p>'+esc(x[2])+'</p></div></div>').join("");
  }

  async function downloadCard(){
    if(!state.profile||!state.champions.length)return;
    const c=state.champions[state.selected]||state.champions[0], score=connectionScore(c), p=state.profile;
    const canvas=document.createElement("canvas"); canvas.width=1200; canvas.height=630;
    const ctx=canvas.getContext("2d");
    const grd=ctx.createLinearGradient(0,0,1200,630); grd.addColorStop(0,"#090b14"); grd.addColorStop(1,"#171326");
    ctx.fillStyle=grd; ctx.fillRect(0,0,1200,630);
    try{
      const blob=await fetch(splash(c.name),{mode:"cors"}).then(r=>r.ok?r.blob():Promise.reject());
      const img=await createImageBitmap(blob);
      const scale=Math.max(1200/img.width,630/img.height),w=img.width*scale,h=img.height*scale;
      ctx.globalAlpha=.48;ctx.drawImage(img,(1200-w)/2,(630-h)/2,w,h);ctx.globalAlpha=1;
      const shade=ctx.createLinearGradient(0,0,780,0);shade.addColorStop(0,"rgba(5,7,14,.96)");shade.addColorStop(1,"rgba(5,7,14,.2)");ctx.fillStyle=shade;ctx.fillRect(0,0,1200,630);
    }catch{}
    ctx.fillStyle="#d9aa55"; ctx.fillRect(70,72,76,6);
    ctx.fillStyle="#f0cf89"; ctx.font="700 24px system-ui"; ctx.fillText("CHAMPION JOURNEY",70,125);
    ctx.fillStyle="#ffffff"; ctx.font="500 92px Georgia"; ctx.fillText(c.name,70,250);
    ctx.fillStyle="#aab4c7"; ctx.font="400 30px system-ui"; ctx.fillText((p.player?.gameName||"Player")+"#"+(p.player?.tagLine||"—"),70,305);
    const stats=[[String(c.games||0),t("games")],[Number(c.avgKda||0).toFixed(1),"KDA"],[c.masteryPoints?fmt(c.masteryPoints):"—",t("mastery")]];
    stats.forEach((s,i)=>{const x=70+i*250;ctx.fillStyle="#ffffff";ctx.font="700 42px system-ui";ctx.fillText(s[0],x,430);ctx.fillStyle="#7f8ba1";ctx.font="500 16px system-ui";ctx.fillText(String(s[1]).toUpperCase(),x,462)});
    ctx.strokeStyle="rgba(217,170,85,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(1010,300,105,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#f0cf89";ctx.font="700 72px system-ui";ctx.textAlign="center";ctx.fillText(String(score),1010,325);
    ctx.fillStyle="#8994a8";ctx.font="600 15px system-ui";ctx.fillText(t("connection").toUpperCase(),1010,365);ctx.textAlign="left";
    const dates=(p.matches||[]).map(m=>Number(m.playedAt||0)).filter(Boolean).sort((a,b)=>a-b);
    const period=dates.length?new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short",year:"numeric"}).format(new Date(dates[0]))+" → "+new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short",year:"numeric"}).format(new Date(dates[dates.length-1])):"recent sample";
    ctx.fillStyle="#aab4c7";ctx.font="500 17px system-ui";ctx.fillText(period,70,530);
    ctx.fillStyle="#5f697c";ctx.font="400 16px system-ui";ctx.fillText("helioconde.github.io/lol-champion-journey",70,565);
    const a=document.createElement("a"); a.download="champion-journey-"+slug(c.name).toLowerCase()+".png"; a.href=canvas.toDataURL("image/png"); a.click();
    window.CJ_OBS?.event("share_card_downloaded",{champion:c.name,score});
  }
  async function copyLink(){
    try{await navigator.clipboard.writeText(location.href);const b=$("#copy-link"),old=b.textContent;b.textContent=t("copied");setTimeout(()=>b.textContent=old,1400)}catch{}
  }
  async function shareNative(){
    const c=state.champions[state.selected]||state.champions[0];
    const data={title:document.title,text:c?t("scoreSummary",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)}):"LoL Champion Journey",url:location.href};
    try{
      if(navigator.share){await navigator.share(data);window.CJ_OBS?.event("native_share",{champion:c?.name||null})}
      else await copyLink();
    }catch{}
  }
  $("#download-card").onclick=downloadCard;
  $("#copy-link").onclick=copyLink;
  $("#share-native").onclick=shareNative;

  $("#search-form").addEventListener("submit",e=>{e.preventDefault();const g=$("#game-name").value.trim(),tag=$("#tag-line").value.trim().replace(/^#/,""),server=$("#region").value;if(g&&tag)loadProfile(g,tag,server)});
  $("#new-profile").onclick=()=>{state.profile=null;$("#profile-view").hidden=true;$("#landing-view").hidden=false;history.replaceState(null,"","./");document.title="LoL Champion Journey — sua história com cada campeão";renderRecent();};
  $("#refresh-data").onclick=()=>{const [g,tag]=($("#profile-riot-id").textContent||"Player#BR1").split("#");const server=new URLSearchParams(location.search).get("server")||"br1";loadProfile(g,tag,server,true)};
  $("#clear-recent").onclick=()=>{localStorage.removeItem("cj:recent");renderRecent()};
  qsa("[data-language]").forEach(b=>b.onclick=()=>{
    setLang(b.dataset.language);
    const u=new URL(location.href);u.searchParams.set("lang",state.lang);history.replaceState(null,"",u.pathname+"?"+u.searchParams.toString());
  });

  addEventListener("beforeinstallprompt",()=>{$("#install-app").hidden=true});
  addEventListener("appinstalled",()=>{$("#install-app").hidden=true});
  if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("./service-worker.js").catch(()=>{});

  const q=new URLSearchParams(location.search);
  const requestedLang=q.get("lang");
  if(requestedLang&&window.CJ_I18N[requestedLang])state.lang=requestedLang;
  setLang(state.lang); renderRecent();
  const id=q.get("riotId"); if(id&&id.includes("#")){const [g,tag]=id.split("#");loadProfile(g,tag,q.get("server")||"br1")}
})();