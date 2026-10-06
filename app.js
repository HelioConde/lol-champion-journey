(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
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
    document.documentElement.lang=lang; $$("[data-language]").forEach(b=>b.classList.toggle("is-active",b.dataset.language===lang));
    $$("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
    if(state.profile) renderProfile();
  }
  const fmt = n => Number(n||0).toLocaleString(state.lang==="pt-BR"?"pt-BR":"en-US");
  const esc = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const slug = name => name.replace(/[^A-Za-z0-9]/g,"");
  const splash = name => "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/"+slug(name)+"_0.jpg";

  function saveRecent(gameName,tagLine,server){
    const key="cj:recent"; let list=[]; try{list=JSON.parse(localStorage.getItem(key)||"[]")}catch{}
    list=[{gameName,tagLine,server},...list.filter(x=>!(x.gameName.toLowerCase()===gameName.toLowerCase()&&x.tagLine.toLowerCase()===tagLine.toLowerCase()))].slice(0,5);
    localStorage.setItem(key,JSON.stringify(list)); renderRecent();
  }
  function renderRecent(){
    let list=[]; try{list=JSON.parse(localStorage.getItem("cj:recent")||"[]")}catch{}
    $("#recent-searches").hidden=!list.length;
    $("#recent-searches-list").innerHTML=list.map((x,i)=>'<button class="recent-search" data-i="'+i+'"><b>'+esc(x.gameName)+"#"+esc(x.tagLine)+'</b><span>'+esc(x.server.toUpperCase())+'</span></button>').join("");
    $$(".recent-search").forEach((b,i)=>b.onclick=()=>loadProfile(list[i].gameName,list[i].tagLine,list[i].server));
  }

  async function fetchProfile(gameName,tagLine,server){
    const endpoint=window.RIOT_LEGACY_BACKEND?.lolProfile;
    if(!endpoint) throw new Error("backend");
    const res=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({gameName,tagLine,platform:server,routing:regions[server]||"americas"})});
    if(!res.ok) throw new Error("http_"+res.status);
    return res.json();
  }

  async function loadProfile(gameName,tagLine,server,refresh=false){
    $("#search-status").textContent=t("loading");
    try{
      const data=await fetchProfile(gameName,tagLine,server);
      if(!data?.championSummaries?.length) throw new Error("empty");
      state.profile=data; state.demo=false;
    }catch(e){
      state.profile={...demo,player:{...demo.player,gameName,tagLine,platform:server.toUpperCase()}}; state.demo=true;
      $("#search-status").textContent=t("fallback");
    }
    state.selected=0;
    prepareChampions();
    saveSnapshot();
    saveRecent(gameName,tagLine,server);
    history.replaceState(null,"","?riotId="+encodeURIComponent(gameName+"#"+tagLine)+"&server="+encodeURIComponent(server));
    $("#landing-view").hidden=true; $("#profile-view").hidden=false; window.scrollTo({top:0,behavior:refresh?"smooth":"auto"});
    renderProfile();
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
  function renderSnapshotComparison(c){
    state.snapshots=readSnapshots();
    $("#snapshot-count").textContent=state.snapshots.length+" snapshot"+(state.snapshots.length===1?"":"s");
    const empty=$("#snapshot-empty"), grid=$("#snapshot-comparison");
    if(state.snapshots.length<2){
      empty.hidden=false; grid.hidden=true; return;
    }
    empty.hidden=true; grid.hidden=false;
    const curr=state.snapshots[state.snapshots.length-1], prev=state.snapshots[state.snapshots.length-2];
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
  }

  function prepareChampions(){
    const p=state.profile||demo;
    const mastery=p.mastery||[];
    state.champions=(p.championSummaries||[]).map(c=>{
      const m=mastery.find(x=>(x.championName||"").toLowerCase()===String(c.name).toLowerCase());
      return {...c,masteryPoints:m?.points||0,masteryLevel:m?.level||0};
    }).sort((a,b)=>(b.games||0)-(a.games||0));
  }
  function connectionScore(c){
    const maxGames=Math.max(...state.champions.map(x=>x.games||0),1);
    const maxMastery=Math.max(...state.champions.map(x=>x.masteryPoints||0),1);
    const presence=(c.games||0)/maxGames;
    const perf=Math.min((c.avgKda||0)/5,1);
    const mast=(c.masteryPoints||0)/maxMastery;
    return Math.round((presence*.5+perf*.3+mast*.2)*100);
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
    $("#champion-list").innerHTML=state.champions.map((x,i)=>'<button class="champion-chip '+(i===state.selected?"active":"")+'" data-i="'+i+'" style="--bg:url(\''+splash(x.name)+'\')"><span><b>'+esc(x.name)+'</b><small>'+fmt(x.games)+' '+t("games")+'</small></span><strong>'+connectionScore(x)+'</strong></button>').join("");
    $$(".champion-chip").forEach(b=>b.onclick=()=>{state.selected=Number(b.dataset.i);renderProfile();document.querySelector(".journey-grid").scrollIntoView({behavior:"smooth",block:"start"})});
    $("#chapter-title").textContent=state.selected===0?t("chapterMain"):t("chapterOther");
    $("#chapter-text").textContent=t("chapterText",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)});
    [["presence",presence],["performance",performance],["mastery",mastery]].forEach(([id,v])=>{$("#"+id+"-label").textContent=v+"%";$("#"+id+"-bar").style.width=v+"%"});
    $("#identity-cards").innerHTML=[
      [t("frequent"),t("frequentText")],[t("performanceTag"),t("performanceText",{kda:Number(c.avgKda||0).toFixed(1)})],[t("masteryTag"),t("masteryText",{points:c.masteryPoints?fmt(c.masteryPoints):"—"})]
    ].map(([a,b])=>'<div><b>'+esc(a)+'</b><p>'+esc(b)+'</p></div>').join("");
    renderSnapshotComparison(c);
    renderTimeline(c);
    $("#share-title").textContent=c.name+" · "+(p.player?.gameName||"Player");
    $("#share-summary").textContent=t("scoreSummary",{name:c.name,games:c.games||0,kda:Number(c.avgKda||0).toFixed(1)});
    $("#share-score").textContent=score;
    document.title=c.name+" · LoL Champion Journey";
  }
  function renderTimeline(c){
    const matches=state.profile?.matches||[];
    const dates=matches.map(m=>Number(m.playedAt||m.gameCreation||0)).filter(Boolean).sort((a,b)=>a-b);
    const first=dates.length?new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short",year:"numeric"}).format(new Date(dates[0])):"—";
    const now=new Intl.DateTimeFormat(state.lang,{day:"2-digit",month:"short"}).format(new Date());
    const items=[[first,t("timeline1"),t("timeline1Text")],["★",t("timeline2"),t("timeline2Text",{name:c.name})],[now,t("timeline3"),t("timeline3Text")]];
    $("#journey-timeline").innerHTML=items.map((x,i)=>'<div class="timeline-item"><span>'+esc(x[0])+'</span><i></i><div><b>'+esc(x[1])+'</b><p>'+esc(x[2])+'</p></div></div>').join("");
  }

  function downloadCard(){
    if(!state.profile||!state.champions.length)return;
    const c=state.champions[state.selected]||state.champions[0], score=connectionScore(c), p=state.profile;
    const canvas=document.createElement("canvas"); canvas.width=1200; canvas.height=630;
    const ctx=canvas.getContext("2d");
    const grd=ctx.createLinearGradient(0,0,1200,630); grd.addColorStop(0,"#090b14"); grd.addColorStop(1,"#171326");
    ctx.fillStyle=grd; ctx.fillRect(0,0,1200,630);
    ctx.fillStyle="#d9aa55"; ctx.fillRect(70,72,76,6);
    ctx.fillStyle="#f0cf89"; ctx.font="700 24px system-ui"; ctx.fillText("CHAMPION JOURNEY",70,125);
    ctx.fillStyle="#ffffff"; ctx.font="500 92px Georgia"; ctx.fillText(c.name,70,250);
    ctx.fillStyle="#aab4c7"; ctx.font="400 30px system-ui"; ctx.fillText((p.player?.gameName||"Player")+"#"+(p.player?.tagLine||"—"),70,305);
    const stats=[[String(c.games||0),t("games")],[Number(c.avgKda||0).toFixed(1),"KDA"],[c.masteryPoints?fmt(c.masteryPoints):"—",t("mastery")]];
    stats.forEach((s,i)=>{const x=70+i*250;ctx.fillStyle="#ffffff";ctx.font="700 42px system-ui";ctx.fillText(s[0],x,430);ctx.fillStyle="#7f8ba1";ctx.font="500 16px system-ui";ctx.fillText(String(s[1]).toUpperCase(),x,462)});
    ctx.strokeStyle="rgba(217,170,85,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.arc(1010,300,105,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#f0cf89";ctx.font="700 72px system-ui";ctx.textAlign="center";ctx.fillText(String(score),1010,325);
    ctx.fillStyle="#8994a8";ctx.font="600 15px system-ui";ctx.fillText(t("connection").toUpperCase(),1010,365);ctx.textAlign="left";
    ctx.fillStyle="#5f697c";ctx.font="400 16px system-ui";ctx.fillText("lol-champion-journey",70,565);
    const a=document.createElement("a"); a.download="champion-journey-"+slug(c.name).toLowerCase()+".png"; a.href=canvas.toDataURL("image/png"); a.click();
  }
  async function copyLink(){
    try{await navigator.clipboard.writeText(location.href);const b=$("#copy-link"),old=b.textContent;b.textContent=t("copied");setTimeout(()=>b.textContent=old,1400)}catch{}
  }
  $("#download-card").onclick=downloadCard;
  $("#copy-link").onclick=copyLink;

  $("#search-form").addEventListener("submit",e=>{e.preventDefault();const g=$("#game-name").value.trim(),tag=$("#tag-line").value.trim().replace(/^#/,""),server=$("#region").value;if(g&&tag)loadProfile(g,tag,server)});
  $("#new-profile").onclick=()=>{state.profile=null;$("#profile-view").hidden=true;$("#landing-view").hidden=false;history.replaceState(null,"","./");document.title="LoL Champion Journey — sua história com cada campeão";renderRecent();};
  $("#refresh-data").onclick=()=>{const [g,tag]=($("#profile-riot-id").textContent||"Player#BR1").split("#");const server=new URLSearchParams(location.search).get("server")||"br1";loadProfile(g,tag,server,true)};
  $("#clear-recent").onclick=()=>{localStorage.removeItem("cj:recent");renderRecent()};
  $$("[data-language]").forEach(b=>b.onclick=()=>setLang(b.dataset.language));
  setLang(state.lang); renderRecent();
  const q=new URLSearchParams(location.search), id=q.get("riotId"); if(id&&id.includes("#")){const [g,tag]=id.split("#");loadProfile(g,tag,q.get("server")||"br1")}
})();