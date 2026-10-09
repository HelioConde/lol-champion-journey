const { test, expect } = require('@playwright/test');

// Chromium test: other browser engines have different SW lifecycles under Playwright.
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'Dedicated desktop Chromium PWA privacy regression');

test('worker does not cache Riot ID links or remove other products caches', async ({page}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const foreign=await caches.open('zerotwo-keep-test');
    await foreign.put('/other-app-data',new Response('kept'));
    await navigator.serviceWorker.register('./service-worker.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.goto('/?riotId=VisualSecret%23BR1&server=br1');
  await page.evaluate(async()=>{
    await fetch('./version.json?token=private-test-value',{cache:'no-store'});
  });
  const result=await page.evaluate(async()=>{
    const names=await caches.keys();
    let urls=[];
    for(const name of names){
      const cache=await caches.open(name);
      urls.push(...(await cache.keys()).map(request=>request.url));
    }
    const foreign=await caches.open('zerotwo-keep-test');
    return {names,urls,kept:await (await foreign.match('/other-app-data'))?.text()};
  });
  expect(result.names).toContain('cj-v4');
  expect(result.kept).toBe('kept');
  expect(result.urls.some(url=>url.includes('VisualSecret')||url.includes('private-test-value'))).toBe(false);
});

test('worker activation cleans only legacy Champion Journey versions',async({page})=>{
  await page.goto('/');
  await page.evaluate(async()=>{
    const previous=await navigator.serviceWorker.getRegistration();
    if(previous)await previous.unregister();
    await caches.open('cj-v3');
    await caches.open('montapc-foreign-keep');
    await navigator.serviceWorker.register('./service-worker.js?qa=upgrade',{scope:'./'});
    await navigator.serviceWorker.ready;
  });
  await expect.poll(()=>page.evaluate(()=>caches.keys())).not.toContain('cj-v3');
  const keys=await page.evaluate(()=>caches.keys());
  expect(keys).toContain('cj-v4');
  expect(keys).toContain('montapc-foreign-keep');
});

test('public app shell remains available without network',async({page,context})=>{
  await page.goto('/');
  await page.evaluate(async()=>{
    await navigator.serviceWorker.register('./service-worker.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try{
    const result=await page.evaluate(async()=>{
      const r=await fetch('./index.html');
      return {ok:r.ok,html:await r.text()};
    });
    expect(result.ok).toBe(true);
    expect(result.html).toContain('id="search-form"');
  }finally{
    await context.setOffline(false);
  }
});
