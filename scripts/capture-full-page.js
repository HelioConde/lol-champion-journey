const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

(async () => {
  const url = process.argv[2] || "https://helioconde.github.io/lol-champion-journey/";
  const out = process.argv[3] || "screenshots/full-page.png";
  const width = Number(process.env.SCREENSHOT_WIDTH || 1440);
  const height = Number(process.env.SCREENSHOT_HEIGHT || 1100);
  const waitSelector = process.env.WAIT_SELECTOR || "";
  const scrollSelector = process.env.SCROLL_SELECTOR || "";
  const fullPage = String(process.env.SCREENSHOT_FULL_PAGE || "true").toLowerCase() !== "false";
  const extraDelay = Number(process.env.SCREENSHOT_DELAY || 1500);
  const mockProfileFile = process.env.MOCK_PROFILE_FILE || "";

  fs.mkdirSync(path.dirname(out), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1
  });

  page.on("console", msg => {
    if (msg.type() === "error") console.error("[browser]", msg.text());
  });

  if(mockProfileFile){
    const mockProfile=JSON.parse(fs.readFileSync(mockProfileFile,"utf8"));
    await page.route("**/public-lol-profile", route => route.fulfill({
      status:200,
      contentType:"application/json",
      body:JSON.stringify(mockProfile)
    }));
  }

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(async () => {
    const images = [...document.images];
    await Promise.all(images.map(img => img.complete ? null : new Promise(resolve => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    })));
    if (document.fonts?.ready) await document.fonts.ready;
  });

  if(waitSelector){
    await page.waitForSelector(waitSelector,{state:"visible",timeout:30000});
  }
  if(scrollSelector){
    await page.waitForSelector(scrollSelector,{state:"visible",timeout:30000});
    await page.locator(scrollSelector).scrollIntoViewIfNeeded();
    await page.evaluate(selector=>document.querySelector(selector)?.scrollIntoView({block:"start"}),scrollSelector);
    await page.waitForTimeout(450);
  }
  await page.waitForTimeout(extraDelay);

  await page.screenshot({
    path: out,
    fullPage,
    animations: "disabled"
  });

  const metrics = await page.evaluate(({scrollSelector,fullPage}) => ({
    title: document.title,
    url: location.href,
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportHeight: innerHeight,
    scrollY,
    scrollSelector: scrollSelector || null,
    fullPage,
    capturedAt: new Date().toISOString(),
    dataMode: document.querySelector("#data-badge")?.textContent?.trim() || null,
    riotId: document.querySelector("#profile-riot-id")?.textContent?.trim() || null
  }),{scrollSelector,fullPage});

  fs.writeFileSync(
    out.replace(/\.png$/i, ".json"),
    JSON.stringify(metrics, null, 2)
  );

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
