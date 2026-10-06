const { test, expect } = require("@playwright/test");

const riotPayload = {
  player:{gameName:"RealPlayer",tagLine:"BR1",level:321,profileIconId:1234,platform:"BR1"},
  ranked:[{queue:"SOLO/DUO",tier:"GOLD",rank:"II",lp:47,wins:32,losses:28,winRate:53}],
  summary:{matches:12,wins:7,losses:5,winRate:58,primaryPosition:"MID"},
  mastery:[
    {championId:99,level:7,points:999999},
    {championId:103,level:7,points:420000}
  ],
  championSummaries:[
    {name:"Lux",games:6,avgKda:4.1,winRate:67,avgDamagePerMin:720,contexts:["RANKED","NORMAL"]},
    {name:"Ahri",games:4,avgKda:3.3,winRate:50,avgDamagePerMin:650,contexts:["RANKED"]},
    {name:"Syndra",games:2,avgKda:2.7,winRate:50,avgDamagePerMin:610,contexts:["NORMAL"]}
  ],
  matches:[
    {playedAt:Date.UTC(2026,8,1),champion:"Lux",context:"RANKED",position:"MID",win:true,kda:4.2,damagePerMin:710,csPerMin:7.2},
    {playedAt:Date.UTC(2026,8,7),champion:"Lux",context:"RANKED",position:"MID",win:false,kda:3.8,damagePerMin:700,csPerMin:7.0},
    {playedAt:Date.UTC(2026,8,12),champion:"Lux",context:"NORMAL",position:"MID",win:true,kda:4.5,damagePerMin:750,csPerMin:7.4},
    {playedAt:Date.UTC(2026,8,18),champion:"Ahri",context:"RANKED",position:"MID",win:true,kda:3.3,damagePerMin:650,csPerMin:6.9}
  ]
};

test.beforeEach(async ({page}) => {
  await page.route("**/realms/br.json", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({n:{champion:"16.20.1"},v:"16.20.1"})}));
  await page.route("**/cdn/16.20.1/data/pt_BR/champion.json", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({data:{
    Lux:{id:"Lux",key:"99",name:"Lux"},
    Ahri:{id:"Ahri",key:"103",name:"Ahri"},
    Syndra:{id:"Syndra",key:"134",name:"Syndra"},
    MasterYi:{id:"MasterYi",key:"11",name:"Master Yi"},
    MonkeyKing:{id:"MonkeyKing",key:"62",name:"Wukong"}
  }})}));
  await page.route("**/public-lol-profile", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(riotPayload)}));
  await page.goto("/");
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
});

test("abre em PT-BR e mostra a proposta central", async ({page}) => {
  await expect(page.locator("html")).toHaveAttribute("lang","pt-BR");
  await expect(page.getByRole("heading",{name:/Descubra como sua relação/i})).toBeVisible();
  await expect(page.getByRole("button",{name:/Ver minha jornada/i})).toBeVisible();
});

test("carrega dados Riot e identifica campeão assinatura", async ({page}) => {
  const pageErrors=[];
  page.on("pageerror",err=>pageErrors.push(String(err.message||err)));
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#profile-view")).toBeVisible();
  await expect(page.locator("#profile-riot-id")).toHaveText("RealPlayer#BR1");
  await expect(page.locator("#data-badge")).toHaveText("DADOS RIOT · LOL");
  await expect(page.locator("#champion-name")).toHaveText("Lux");
  await expect(page.locator("#metric-games")).toHaveText("6");
  await expect(page.locator("#metric-kda")).toHaveText("4.1");
  await expect(page.locator("#metric-mastery")).toContainText("999");
  await expect(page.locator("#champion-list")).toContainText("Ahri");
  await expect(page).toHaveURL(/riotId=RealPlayer%23BR1/);
  expect(pageErrors).toEqual([]);
});

test("permite navegar entre capítulos de campeões", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await page.locator(".champion-chip").filter({hasText:"Ahri"}).click();
  await expect(page.locator("#champion-name")).toHaveText("Ahri");
  await expect(page.locator("#share-title")).toContainText("Ahri");
});

test("inglês persiste", async ({page}) => {
  await page.locator('[data-language="en"]').first().click();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.getByRole("heading",{name:/See how your relationship/i})).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
});

test("fallback fica claramente identificado", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  await page.route("**/public-lol-profile", route => route.fulfill({status:429,contentType:"application/json",body:'{"error":"rate_limited"}'}));
  await page.locator("#game-name").fill("Fallback");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#data-badge")).toHaveText("DEMONSTRAÇÃO");
  await expect(page.locator("#sample-note")).toContainText(/Limite temporário|demonstração/i);
  await expect(page.locator("#retry-demo")).toBeVisible();
});

test("mobile não cria overflow horizontal crítico", async ({page}) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto("/");
  const width=await page.locator("body").evaluate(el=>el.scrollWidth);
  expect(width).toBeLessThanOrEqual(361);
});

test("deep link restaura a jornada", async ({page}) => {
  await page.goto("/?riotId=RealPlayer%23BR1&server=br1");
  await expect(page.locator("#profile-view")).toBeVisible();
  await expect(page.locator("#profile-riot-id")).toHaveText("RealPlayer#BR1");
});
test("gera card PNG do campeão selecionado", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  const downloadPromise=page.waitForEvent("download");
  await page.getByRole("button",{name:"Baixar card PNG"}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe("champion-journey-lux.png");
});

test("salva snapshot real e mostra comparação na segunda consulta", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#snapshot-count")).toContainText("1 registro");
  await expect(page.locator("#snapshot-empty")).toBeVisible();
  await expect(page.locator("#snapshot-refresh")).toBeVisible();

  const secondPayload={...riotPayload,
    championSummaries:[
      {name:"Ahri",games:7,avgKda:4.8,winRate:71,avgDamagePerMin:760,contexts:["RANKED"]},
      {name:"Lux",games:6,avgKda:4.3,winRate:67,avgDamagePerMin:730,contexts:["RANKED","NORMAL"]},
      {name:"Syndra",games:2,avgKda:2.7,winRate:50,avgDamagePerMin:610,contexts:["NORMAL"]}
    ],
    mastery:[
      {championId:99,level:7,points:1001200},
      {championId:103,level:7,points:430500}
    ]
  };
  await page.unroute("**/public-lol-profile");
  await page.route("**/public-lol-profile", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(secondPayload)}));
  await page.getByRole("button",{name:"Atualizar dados"}).click();

  await expect(page.locator("#snapshot-count")).toContainText("2 registros");
  await expect(page.locator("#snapshot-comparison")).toBeVisible();
  await expect(page.locator("#delta-signature")).toHaveText("Ahri");
  await expect(page.locator("#delta-signature-note")).toContainText("Lux");
  await expect(page.locator("#champion-name")).toHaveText("Lux");
  await expect(page.locator("#delta-games")).toHaveText("0");
  await page.locator(".champion-chip").filter({hasText:"Ahri"}).click();
  await expect(page.locator("#delta-games")).toHaveText("+3");
});

test("não duplica snapshot quando os dados não mudam", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await page.getByRole("button",{name:"Atualizar dados"}).click();
  await expect(page.locator("#snapshot-count")).toContainText("1 registro");
});


test("mostra análise e comparação explicáveis", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#champion-facts")).toContainText("67%");
  await expect(page.locator("#formula-explanation")).toContainText("Lux");
  await expect(page.locator("#champion-comparison")).toContainText("Ahri");
  await expect(page.locator("#consistency-label")).not.toHaveText("0%");
});

test("timeline usa partidas reais do campeão quando disponíveis", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#journey-timeline")).toContainText("RANKED");
  await expect(page.locator("#journey-timeline")).toContainText("KDA");
});

test("SEO e PWA essenciais estão configurados", async ({page}) => {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://helioconde.github.io/lol-champion-journey/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href","./manifest.webmanifest");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content",/LoL Champion Journey/);
  const manifest=await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const body=await manifest.json();
  expect(body.display).toBe("standalone");
  expect(body.icons.length).toBeGreaterThanOrEqual(2);
});

test("Riot ID inexistente recebe mensagem específica", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:502,
    contentType:"application/json",
    body:JSON.stringify({error:"player",message:"Riot ID não encontrado. Confira Nome#TAG.",riotStatus:404})
  }));
  await page.locator("#game-name").fill("DoesNotExist");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#search-status")).toContainText("Riot ID não encontrado");
  await expect(page.locator("#landing-view")).toBeVisible();
  await expect(page.locator("#profile-view")).toBeHidden();
});

test("cards de campeão usam imagens lazy", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator(".champion-chip img").first()).toHaveAttribute("loading","lazy");
});


test("localStorage corrompido não quebra a aplicação", async ({page}) => {
  await page.evaluate(() => {
    localStorage.setItem("cj:recent", "{broken");
    localStorage.setItem("cj:snapshots:realplayer:br1:br1", "{broken");
  });
  await page.reload();
  await expect(page.getByRole("heading",{name:/Descubra como sua relação/i})).toBeVisible();
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#profile-view")).toBeVisible();
});

test("falha do Data Dragon não impede carregar dados Riot", async ({page}) => {
  await page.unroute("**/realms/br.json");
  await page.unroute("**/cdn/16.20.1/data/pt_BR/champion.json");
  await page.route("**/realms/br.json", route => route.fulfill({status:503,body:"unavailable"}));
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#profile-view")).toBeVisible();
  await expect(page.locator("#champion-name")).toHaveText("Lux");
});

test("idioma pode ser aberto por deep link", async ({page}) => {
  await page.goto("/?lang=en");
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.getByRole("heading",{name:/See how your relationship/i})).toBeVisible();
});

test("página de privacidade está publicada e bilíngue", async ({page}) => {
  await page.goto("/privacy.html");
  await expect(page.getByRole("heading",{name:"Como seus dados são usados"})).toBeVisible();
  await expect(page.locator("body")).toContainText("PT-BR");
  await expect(page.locator("body")).toContainText("English");
});

test("não gera erro de runtime ao iniciar e trocar idioma", async ({page}) => {
  const errors=[];
  page.on("pageerror", err => errors.push(String(err.message||err)));
  await page.goto("/");
  await expect(page.getByRole("button",{name:"EN"})).toBeVisible();
  await page.locator('[data-language="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  expect(errors).toEqual([]);
});

test("reduz a amostra antes de usar demonstração", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  const limits=[];
  await page.route("**/public-lol-profile", async route => {
    const body=JSON.parse(route.request().postData()||"{}");
    limits.push(body.limit);
    if(body.limit===30){
      await route.fulfill({status:502,contentType:"application/json",body:JSON.stringify({error:"temporary",message:"temporary"})});
      return;
    }
    await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(riotPayload)});
  });

  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();

  await expect(page.locator("#data-badge")).toHaveText("DADOS RIOT · LOL");
  await expect(page.locator("#profile-riot-id")).toHaveText("RealPlayer#BR1");
  expect(limits.slice(0,2)).toEqual([30,20]);
});

test("navegação do perfil destaca a primeira seção", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator('.profile-nav a[href="#champion-hero"]')).toHaveClass(/is-active/);
});

test("amostra parcial não vira snapshot histórico", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  const partialPayload={
    ...riotPayload,
    summary:{...riotPayload.summary,matches:3},
    championSummaries:[
      {name:"Senna",games:3,avgKda:2.0}
    ],
    cache:{requested:30,availableIds:30,matchesLoaded:3,cached:3,fetched:0,pending:27,rateLimited:true}
  };
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify(partialPayload)
  }));

  await page.locator("#game-name").fill("PartialPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();

  await expect(page.locator("#data-badge")).toContainText("AMOSTRA PARCIAL");
  await expect(page.locator("#sample-note")).toContainText("3 de 30");
  await expect(page.locator("#snapshot-partial")).toBeVisible();
  await expect(page.locator("#snapshot-count")).toContainText("0 registros");
});

test("amostra parcial mostra confiança e ação de completar", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  const partialPayload={
    ...riotPayload,
    summary:{...riotPayload.summary,matches:3,confidence:"INICIAL"},
    championSummaries:[{name:"Senna",games:3,avgKda:2.0}],
    cache:{requested:30,availableIds:30,matchesLoaded:3,cached:3,fetched:0,pending:27,rateLimited:true}
  };
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify(partialPayload)
  }));

  await page.locator("#game-name").fill("PartialPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();

  await expect(page.locator("#confidence-badge")).toHaveText("Confiança inicial");
  await expect(page.locator("#complete-sample")).toBeVisible();
});

test("comparação destaca vencedores por métrica", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  const rows=page.locator("#champion-comparison .compare-row");
  await expect(rows).toHaveCount(6);
  await expect(rows.filter({hasText:"partidas"}).locator("strong").first()).toHaveClass(/is-winner/);
  await expect(rows.filter({hasText:"KDA"}).locator("strong").first()).toHaveClass(/is-winner/);
});

test("comparação gera resumo em linguagem natural", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#comparison-summary")).toContainText(/Lux|Ahri/);
  await expect(page.locator(".champion-chip").first()).toHaveAttribute("aria-pressed","true");
  await page.locator(".champion-chip").nth(1).click();
  await expect(page.locator(".champion-chip").nth(1)).toHaveAttribute("aria-pressed","true");
});

test("deep link preserva o campeão selecionado", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await page.locator(".champion-chip").filter({hasText:"Ahri"}).click();
  await expect(page).toHaveURL(/champion=Ahri/);
  await page.reload();
  await expect(page.locator("#champion-name")).toHaveText("Ahri");
  await expect(page.locator('.champion-chip[aria-pressed="true"]')).toContainText("Ahri");
});

test("normaliza nomes internos pelo Data Dragon", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify({
      ...riotPayload,
      championSummaries:[
        {name:"MasterYi",games:3,avgKda:3.1},
        {name:"MonkeyKing",games:2,avgKda:2.8}
      ],
      mastery:[
        {championId:11,level:7,points:500000},
        {championId:62,level:6,points:180000}
      ],
      matches:[]
    })
  }));
  await page.locator("#game-name").fill("CanonicalNames");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#champion-name")).toHaveText("Master Yi");
  await expect(page.locator("#champion-list")).toContainText("Wukong");
  await expect(page.locator("#champion-list")).not.toContainText("MasterYi");
  await expect(page.locator("#champion-list")).not.toContainText("MonkeyKing");
});

test("Arena usa melhor colocação em vez de taxa de vitória", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify({
      ...riotPayload,
      summary:{...riotPayload.summary,matches:3},
      championSummaries:[{name:"Lux",games:3,avgKda:2.8,contexts:["ARENA"]}],
      matches:[
        {playedAt:Date.UTC(2026,8,1),champion:"Lux",context:"ARENA",placement:4,kda:2.2,damagePerMin:700},
        {playedAt:Date.UTC(2026,8,2),champion:"Lux",context:"ARENA",placement:2,kda:3.1,damagePerMin:730},
        {playedAt:Date.UTC(2026,8,3),champion:"Lux",context:"ARENA",placement:6,kda:2.9,damagePerMin:710}
      ]
    })
  }));
  await page.locator("#game-name").fill("ArenaPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#champion-facts")).toContainText("Melhor colocação");
  await expect(page.locator("#champion-facts")).toContainText("#2");
});

test("comparação de Arena usa colocação e menor valor vence", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify({
      ...riotPayload,
      summary:{...riotPayload.summary,matches:4},
      championSummaries:[
        {name:"Lux",games:2,avgKda:3.0,contexts:["ARENA"]},
        {name:"Ahri",games:2,avgKda:2.5,contexts:["ARENA"]}
      ],
      matches:[
        {playedAt:Date.UTC(2026,8,1),champion:"Lux",context:"ARENA",placement:2,kda:3.3,damagePerMin:720},
        {playedAt:Date.UTC(2026,8,2),champion:"Lux",context:"ARENA",placement:4,kda:2.7,damagePerMin:700},
        {playedAt:Date.UTC(2026,8,3),champion:"Ahri",context:"ARENA",placement:5,kda:2.8,damagePerMin:650},
        {playedAt:Date.UTC(2026,8,4),champion:"Ahri",context:"ARENA",placement:7,kda:2.2,damagePerMin:630}
      ]
    })
  }));
  await page.locator("#game-name").fill("ArenaCompare");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  const placementRow=page.locator("#champion-comparison .compare-row").filter({hasText:"Melhor colocação"});
  await expect(placementRow).toContainText("#2");
  await expect(placementRow).toContainText("#5");
  await expect(placementRow.locator("strong").first()).toHaveClass(/is-winner/);
});

test("hero mostra o contexto dominante da amostra", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#hero-context")).toContainText("RANQUEADA");
  await expect(page.locator("#hero-context")).toContainText("NORMAL");
});

test("hero identifica recorte de Arena", async ({page}) => {
  await page.unroute("**/public-lol-profile");
  const arenaPayload={
    ...riotPayload,
    summary:{...riotPayload.summary,primaryPosition:null},
    championSummaries:[{name:"Senna",games:3,avgKda:2.0,contexts:["ARENA"]}],
    mastery:[],
    matches:[
      {playedAt:Date.UTC(2026,8,20),champion:"Senna",context:"ARENA",placement:2,kda:4.0,damagePerMin:1081},
      {playedAt:Date.UTC(2026,8,21),champion:"Senna",context:"ARENA",placement:5,kda:1.2,damagePerMin:955},
      {playedAt:Date.UTC(2026,8,24),champion:"Senna",context:"ARENA",placement:6,kda:0.9,damagePerMin:820}
    ]
  };
  await page.route("**/public-lol-profile", route => route.fulfill({
    status:200,
    contentType:"application/json",
    body:JSON.stringify(arenaPayload)
  }));
  await page.locator("#game-name").fill("ArenaPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#hero-context")).toHaveText("Recorte: ARENA");
  await expect(page.locator("#champion-facts")).toContainText("Melhor colocação");
  await expect(page.locator("#champion-facts")).toContainText("Colocação média");
  await expect(page.locator("#champion-facts")).toContainText("Taxa de Top 4");
  await expect(page.locator("#champion-facts")).not.toContainText("CS/min");
  await expect(page.locator("#champion-facts")).not.toContainText("L3");
});

test("mostra identidade Riot com nível e elo", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator("#profile-level")).toHaveText("Nível 321");
  await expect(page.locator("#profile-rank")).toContainText("Ouro II");
  await expect(page.locator("#profile-rank")).toContainText("47 LP");
  const hasVisibleAvatar=await page.locator("#profile-icon,#profile-avatar-fallback").evaluateAll(els=>els.some(el=>!el.hidden));
  expect(hasVisibleAvatar).toBeTruthy();
});
