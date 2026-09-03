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

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('.site-loader').waitFor({ state: 'detached', timeout: 4000 });
  const loadingState = await page.locator('body').getAttribute('aria-busy');
  if (loadingState !== 'false') failures.push(`${name}: loading screen did not release cleanly`);
  const bodyBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  if (bodyBackground !== 'rgb(255, 255, 255)') failures.push(`${name}: page background is not white`);
  await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));

  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('Three studios')) failures.push(`${name}: removed hero studio-count phrase is visible`);

  const heroWave = page.locator('.hero-wave');
  if ((await heroWave.count()) !== 1) {
    failures.push(`${name}: animated hero wave is missing`);
  } else {
    const waveState = await heroWave.evaluate((element) => {
      const path = element.querySelector('path');
      const movingElement = [element, ...element.querySelectorAll('*')]
        .find((item) => getComputedStyle(item).animationName !== 'none');
      return {
        animationName: movingElement ? getComputedStyle(movingElement).animationName : 'none',
        stroke: path ? getComputedStyle(path).stroke : 'none',
      };
    });
    if (waveState.animationName === 'none') failures.push(`${name}: hero wave is not animated`);
    if (waveState.stroke !== 'rgb(214, 0, 98)') failures.push(`${name}: hero wave is not Empress pink`);
  }

  const counterAudit = await page.evaluate(() => ({
    serviceLabels: [...document.querySelectorAll('.service-card-copy > p')].map((item) => item.textContent.trim()),
    leftoverCounterElements: document.querySelectorAll(
      '.location-tabs button > span, .booking-steps li > span, .dialog-promise > span',
    ).length,
  }));
  if (counterAudit.serviceLabels.some((label) => /^0?\d+\s*\//.test(label))) {
    failures.push(`${name}: a numbered service label remains`);
  }
  if (counterAudit.leftoverCounterElements) {
    failures.push(`${name}: ${counterAudit.leftoverCounterElements} decorative counter element(s) remain`);
  }

  const expectedContacts = {
    'RNG Plaza': ['tel:+254720016178', 'instagram.com/empressbeautycare/', 'tiktok.com/@empressbeautycare', 'facebook.com/p/Empress-BeautyCare-100070468808845/'],
    'Simara Mall': ['tel:+254720016178', 'instagram.com/empress_beautycare_2/', 'tiktok.com/@empressbeautycare2', 'facebook.com/p/Empress-Beautycare-2-100044461598491/'],
    'Morovian Mall': ['tel:+254796350593', 'instagram.com/empressbeautycare/', 'tiktok.com/@empressbeautycare3', 'facebook.com/p/Empress-BeautyCare-100070468808845/'],
  };
  const contactCards = await page.locator('.branch-contact-card').evaluateAll((cards) => cards.map((card) => ({
    branch: card.querySelector('h3')?.textContent.trim() || '',
    destinations: [...card.querySelectorAll('a.contact-method')].map((link) => link.getAttribute('href') || ''),
    icons: [...card.querySelectorAll('a.contact-method use')].map((icon) => icon.getAttribute('href') || ''),
  })));
  if (contactCards.length !== 3) failures.push(`${name}: expected 3 branch contact cards, found ${contactCards.length}`);
  for (const card of contactCards) {
    const destinations = expectedContacts[card.branch];
    if (!destinations) {
      failures.push(`${name}: unexpected branch contact card “${card.branch}”`);
      continue;
    }
    if (card.destinations.length !== 4) failures.push(`${name}: ${card.branch} does not have 4 icon contact links`);
    for (const destination of destinations) {
      if (!card.destinations.some((href) => href.includes(destination))) {
        failures.push(`${name}: ${card.branch} is missing contact destination ${destination}`);
      }
    }
    for (const icon of ['#icon-phone', '#icon-instagram', '#icon-tiktok', '#icon-facebook']) {
      if (!card.icons.includes(icon)) failures.push(`${name}: ${card.branch} is missing ${icon.slice(1)} contact icon`);
    }
  }

  if (!mobile) {
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    await page.locator('.primary-nav a[href="#services"]').evaluate((link) => link.click());
    await page.waitForTimeout(900);
    await page.locator('.primary-nav a[href="#prices"]').evaluate((link) => link.click());
    await page.waitForTimeout(80);
    const liquidMotion = await page.locator('[data-nav-liquid]').evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      opacity: Number.parseFloat(getComputedStyle(element).opacity),
      running: element.getAnimations().some((animation) => animation.playState === 'running'),
    }));
    if (liquidMotion.background !== 'rgb(214, 0, 98)' || liquidMotion.opacity < .8) {
      failures.push(`${name}: liquid navigation fill is not visibly pink`);
    }
    if (!liquidMotion.running) failures.push(`${name}: navigation fill did not animate between links`);
    await page.waitForTimeout(900);
    const navigationState = await page.evaluate(() => {
      const link = document.querySelector('.primary-nav a[href="#prices"]');
      const liquid = document.querySelector('[data-nav-liquid]');
      if (!link || !liquid) return null;
      const linkBox = link.getBoundingClientRect();
      const liquidBox = liquid.getBoundingClientRect();
      return {
        active: link.getAttribute('aria-current'),
        centerDelta: Math.abs((linkBox.left + linkBox.width / 2) - (liquidBox.left + liquidBox.width / 2)),
        color: getComputedStyle(link).color,
      };
    });
    if (!navigationState || navigationState.active !== 'true') failures.push(`${name}: clicked Pricing navigation link did not become active`);
    if (navigationState && (navigationState.centerDelta > 10 || navigationState.color !== 'rgb(255, 255, 255)')) {
      failures.push(`${name}: pink navigation fill did not settle beneath the active link`);
    }
  }

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
    await page.locator('.primary-nav a[href="#services"]').click();
    await page.waitForTimeout(160);
    await page.locator('.menu-toggle').click();
    const activeMobileFill = await page.locator('.primary-nav a[href="#services"]').evaluate((link) => ({
      active: link.getAttribute('aria-current'),
      background: getComputedStyle(link).backgroundColor,
      color: getComputedStyle(link).color,
    }));
    if (activeMobileFill.active !== 'true' || activeMobileFill.background !== 'rgb(214, 0, 98)' || activeMobileFill.color !== 'rgb(255, 255, 255)') {
      failures.push(`${name}: active mobile navigation link is not filled pink`);
    }
    await page.keyboard.press('Escape');
  }

  await page.locator('[data-map-tab="ruiru"]').click();
  const mapTitle = await page.locator('[data-branch-map]').getAttribute('title');
  const selectedLocation = await page.locator('[data-map-name]').textContent();
  if (mapTitle !== 'Map showing Empress Beautycare at Morovian Mall' || selectedLocation !== 'Morovian Mall') {
    failures.push(`${name}: branch map did not switch to Morovian Mall`);
  }
  await page.locator('[data-map-loading]').waitFor({ state: 'hidden', timeout: 10000 });

  await page.locator('[data-map-booking]').click();
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
console.log('✓ Loader, hero wave, liquid navigation, branch contacts, white canvas, images, map tabs, booking, and WhatsApp routing passed');
