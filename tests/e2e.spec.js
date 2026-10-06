const { test, expect } = require("@playwright/test");

const riotPayload = {
  player:{gameName:"RealPlayer",tagLine:"BR1",level:321,platform:"BR1"},
  summary:{matches:12,wins:7,losses:5,winRate:58,primaryPosition:"MID"},
  mastery:[
    {championId:99,level:7,points:999999},
    {championId:103,level:7,points:420000}
  ],
  championSummaries:[
    {name:"Lux",games:6,avgKda:4.1},
    {name:"Ahri",games:4,avgKda:3.3},
    {name:"Syndra",games:2,avgKda:2.7}
  ],
  matches:[
    {playedAt:Date.UTC(2026,8,1)},{playedAt:Date.UTC(2026,8,7)},
    {playedAt:Date.UTC(2026,8,12)},{playedAt:Date.UTC(2026,8,18)}
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
      {name:"Ahri",games:7,avgKda:4.8},
      {name:"Lux",games:6,avgKda:4.3},
      {name:"Syndra",games:2,avgKda:2.7}
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
