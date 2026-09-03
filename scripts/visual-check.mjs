import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:5173';
const reportsDirectory = resolve(import.meta.dirname, '..', 'reports');
await mkdir(reportsDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});

const failures = [];

const exercisePage = async ({ name, width, height, mobile = false }) => {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.__openedUrl = '';
    window.open = (url) => {
      window.__openedUrl = String(url);
      return null;
    };
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('.site-loader').waitFor({ state: 'detached', timeout: 4000 });
  const loadingState = await page.locator('body').getAttribute('aria-busy');
  if (loadingState !== 'false') failures.push(`${name}: loading screen did not release cleanly`);
  const bodyBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  if (bodyBackground !== 'rgb(255, 255, 255)') failures.push(`${name}: page background is not white`);
  await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
  await page.evaluate(async () => {
    const pause = (time) => new Promise((resolvePause) => setTimeout(resolvePause, time));
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(420, innerHeight * 0.72)) {
      scrollTo(0, y);
      await pause(120);
    }
    const serviceRail = document.querySelector('[data-scroller]');
    if (serviceRail) {
      serviceRail.scrollTo({ left: serviceRail.scrollWidth, behavior: 'instant' });
      await pause(500);
      serviceRail.scrollTo({ left: 0, behavior: 'instant' });
    }
    await pause(700);
    scrollTo(0, 0);
    await pause(180);
  });

  const brokenImages = await page.locator('img').evaluateAll((images) =>
    images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
  );
  if (brokenImages.length) failures.push(`${name}: ${brokenImages.length} broken image(s): ${brokenImages.join(', ')}`);
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (horizontalOverflow > 1) failures.push(`${name}: page overflows horizontally by ${horizontalOverflow}px`);

  if (mobile) {
    await page.locator('.menu-toggle').click();
    const menuIsOpen = await page.locator('body').evaluate((element) => element.classList.contains('menu-open'));
    if (!menuIsOpen) failures.push(`${name}: mobile menu did not open`);
    await page.keyboard.press('Escape');
  }

  await page.locator('[data-open-booking][data-branch="ruiru"]').click();
  const dialogIsOpen = await page.locator('#booking-dialog').evaluate((dialog) => dialog.hasAttribute('open'));
  if (!dialogIsOpen) failures.push(`${name}: booking dialog did not open`);
  await page.waitForTimeout(420);
  await page.screenshot({ path: resolve(reportsDirectory, `${name}-booking.png`) });

  const form = page.locator('#booking-form');
  if ((await form.locator('[name="branch"]').inputValue()) !== 'ruiru') {
    failures.push(`${name}: branch CTA did not preselect Ruiru`);
  }
  await form.locator('[name="name"]').fill('Site QA');
  await form.locator('[name="service"]').selectOption({ label: 'Nails' });
  await form.locator('[name="date"]').fill('2026-09-12');
  await form.locator('[name="understood"]').check();
  await form.locator('button[type="submit"]').click();
  const openedUrl = await page.evaluate(() => window.__openedUrl);
  if (!openedUrl.includes('254796350593') || !openedUrl.includes('Nails')) {
    failures.push(`${name}: WhatsApp request routing was incorrect`);
  }
  await page.locator('[data-close-booking]').last().click();

  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(120);
  await page.screenshot({ path: resolve(reportsDirectory, `${name}.png`), fullPage: true });
  if (pageErrors.length) failures.push(`${name}: console errors: ${pageErrors.join(' | ')}`);
  await context.close();
};

try {
  await exercisePage({ name: 'desktop', width: 1440, height: 1000 });
  await exercisePage({ name: 'mobile', width: 390, height: 844, mobile: true });
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  process.exit(1);
}

console.log('✓ Desktop and mobile layouts captured');
console.log('✓ Loader, white canvas, images, mobile menu, booking dialog, and Ruiru WhatsApp routing passed');
