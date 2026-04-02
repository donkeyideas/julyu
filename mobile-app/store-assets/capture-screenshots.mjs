import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'google-play');
const MOCKUPS_DIR = path.join(__dirname, '..', 'mockups');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // ── Phone Screenshots (1080x1920, 9:16) ──
  const screenshotsUrl = `file:///${MOCKUPS_DIR.replace(/\\/g, '/')}/screenshots-google.html`;
  await page.goto(screenshotsUrl, { waitUntil: 'networkidle' });

  // Set zoom to 100% so slides render at native 1080x1920
  await page.evaluate(() => {
    document.querySelectorAll('.screenshot-slide').forEach(el => {
      el.style.transform = 'scale(1)';
      el.style.transformOrigin = 'top center';
      el.style.marginBottom = '60px';
    });
  });

  // Wait for fonts
  await page.waitForTimeout(2000);

  const slideIds = ['slide-1', 'slide-2', 'slide-3', 'slide-5', 'slide-6', 'slide-7'];
  const slideNames = ['01-hero', '02-compare-prices', '03-scan-receipts', '04-jules-ai-chat', '05-features', '06-download'];

  // Also grab slide-5 which is actually the Jules chat (id might differ after edits)
  // Let me just grab all .screenshot-slide elements in order
  const slideCount = await page.locator('.screenshot-slide').count();
  console.log(`Found ${slideCount} slides`);

  for (let i = 0; i < slideCount; i++) {
    const slide = page.locator('.screenshot-slide').nth(i);
    const name = slideNames[i] || `slide-${i + 1}`;
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`);

    // Ensure the slide is visible
    await slide.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await slide.screenshot({
      path: outputPath,
      type: 'png',
    });

    // Verify dimensions
    const box = await slide.boundingBox();
    console.log(`✓ ${name}.png captured (${Math.round(box.width)}x${Math.round(box.height)})`);
  }

  // ── Feature Graphic (1024x500) ──
  const banner = page.locator('#slide-banner');
  await page.evaluate(() => {
    const b = document.getElementById('slide-banner');
    if (b) {
      b.style.transform = 'scale(1)';
      b.style.transformOrigin = 'top center';
      b.style.marginBottom = '60px';
    }
  });
  await banner.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await banner.screenshot({
    path: path.join(OUTPUT_DIR, 'feature-graphic-1024x500.png'),
    type: 'png',
  });
  const bannerBox = await banner.boundingBox();
  console.log(`✓ feature-graphic-1024x500.png captured (${Math.round(bannerBox.width)}x${Math.round(bannerBox.height)})`);

  // ── App Icon (512x512) ──
  // Read logo as base64 so it works in headless browser
  const logoPngPath = path.join(MOCKUPS_DIR, 'julyu_j.png');
  const logoBase64 = fs.readFileSync(logoPngPath).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const iconPage = await context.newPage();
  await iconPage.setViewportSize({ width: 512, height: 512 });
  await iconPage.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: 512px; height: 512px;
        display: flex; align-items: center; justify-content: center;
        background: #ffffff;
        overflow: hidden;
      }
      img {
        width: 320px; height: 320px;
        object-fit: contain;
      }
    </style></head>
    <body>
      <img src="${logoDataUri}" alt="Julyu">
    </body>
    </html>
  `, { waitUntil: 'networkidle' });
  await iconPage.waitForTimeout(1000);

  await iconPage.screenshot({
    path: path.join(OUTPUT_DIR, 'app-icon-512.png'),
    type: 'png',
    clip: { x: 0, y: 0, width: 512, height: 512 },
  });
  console.log('✓ app-icon-512.png captured (512x512)');

  await browser.close();
  console.log(`\nAll assets saved to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
