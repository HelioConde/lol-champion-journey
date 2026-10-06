const { test, expect } = require("@playwright/test");

const riotPayload = {
  player:{gameName:"RealPlayer",tagLine:"BR1",level:321,platform:"BR1"},
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
    Syndra:{id:"Syndra",key:"134",name:"Syndra"}
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
  await expect(page.locator("#sample-note")).toContainText("Dados demonstrativos");
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
  await expect(page.locator("#snapshot-count")).toContainText("1 snapshot");
  await expect(page.locator("#snapshot-empty")).toBeVisible();

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

  await expect(page.locator("#snapshot-count")).toContainText("2 snapshots");
  await expect(page.locator("#snapshot-comparison")).toBeVisible();
  await expect(page.locator("#delta-signature")).toHaveText("Ahri");
  await expect(page.locator("#delta-signature-note")).toContainText("Lux");
  await expect(page.locator("#delta-games")).toHaveText("+3");
});

test("não duplica snapshot quando os dados não mudam", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await page.getByRole("button",{name:"Atualizar dados"}).click();
  await expect(page.locator("#snapshot-count")).toContainText("1 snapshot");
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
  await expect(page.locator("#data-badge")).toHaveText("DEMONSTRAÇÃO");
});

test("cards de campeão usam imagens lazy", async ({page}) => {
  await page.locator("#game-name").fill("RealPlayer");
  await page.locator("#tag-line").fill("BR1");
  await page.getByRole("button",{name:/Ver minha jornada/i}).click();
  await expect(page.locator(".champion-chip img").first()).toHaveAttribute("loading","lazy");
});
