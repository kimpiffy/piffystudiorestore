const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto('http://127.0.0.1:8051/work/art/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const cell = await page.$('[data-id="polycephaly"]');
  if (cell) {
    await cell.screenshot({ path: '/tmp/poly_06.png' });
    console.log('saved');
  } else {
    console.log('not found');
  }
  await browser.close();
})();
