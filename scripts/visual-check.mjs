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

  if ((await page.locator('.hero-wave').count()) !== 0) failures.push(`${name}: superseded thin hero wave remains`);

  const heroStage = page.locator('.hero-stage');
  if ((await heroStage.count()) !== 1) {
    failures.push(`${name}: responsive hero stage is missing`);
  } else {
    const heroPanelState = await heroStage.evaluate((stage, expectsMobileShape) => {
      const desktopShape = stage.querySelector('.hero-panel-shape--desktop');
      const mobileShape = stage.querySelector('.hero-panel-shape--mobile');
      const expectedShape = expectsMobileShape ? mobileShape : desktopShape;
      const alternateShape = expectsMobileShape ? desktopShape : mobileShape;
      const copy = stage.querySelector('.hero-copy');
      const image = stage.querySelector('.hero-main-image img');
      const heading = copy?.querySelector('h1');
      const intro = copy?.querySelector('.hero-intro');
      const isRendered = (element) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden'
          && Number.parseFloat(style.opacity) > 0 && box.width > 0 && box.height > 0;
      };
      const stageBox = stage.getBoundingClientRect();
      const shapeBox = expectedShape?.getBoundingClientRect();
      const copyBox = copy?.getBoundingClientRect();
      const imageBox = image?.getBoundingClientRect();
      const headingBox = heading?.getBoundingClientRect();
      const pinkPath = [...(expectedShape?.querySelectorAll('path') ?? [])]
        .find((path) => getComputedStyle(path).fill === 'rgb(214, 0, 98)');

      let copyCenterIsInsidePanel = false;
      let panelAnchoredRight = false;
      let panelLeavesImageVisibleLeft = false;
      let panelCoversMiddle = false;
      if (pinkPath && copyBox && typeof pinkPath.isPointInFill === 'function') {
        const matrix = pinkPath.getScreenCTM();
        if (matrix) {
          const pointIsInPanel = (x, y) => pinkPath.isPointInFill(new DOMPoint(x, y).matrixTransform(matrix.inverse()));
          copyCenterIsInsidePanel = pointIsInPanel(
            copyBox.left + copyBox.width / 2,
            copyBox.top + copyBox.height / 2,
          );
          panelAnchoredRight = pointIsInPanel(stageBox.right - 2, stageBox.top + stageBox.height / 2);
          panelLeavesImageVisibleLeft = !pointIsInPanel(stageBox.left + 2, stageBox.top + stageBox.height / 2);
          panelCoversMiddle = pointIsInPanel(stageBox.left + stageBox.width / 2, stageBox.top + stageBox.height / 2);
        }
      }

      const overlapWidth = shapeBox && copyBox
        ? Math.max(0, Math.min(shapeBox.right, copyBox.right) - Math.max(shapeBox.left, copyBox.left))
        : 0;
      const overlapHeight = shapeBox && copyBox
        ? Math.max(0, Math.min(shapeBox.bottom, copyBox.bottom) - Math.max(shapeBox.top, copyBox.top))
        : 0;
      const copyArea = copyBox ? copyBox.width * copyBox.height : 0;
      const topElement = headingBox
        ? document.elementFromPoint(headingBox.left + headingBox.width / 2, headingBox.top + headingBox.height / 2)
        : null;
      const isLightText = (element) => {
        if (!element) return false;
        const channels = getComputedStyle(element).color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
        return channels.length === 3 && channels.every((channel) => channel >= 230);
      };

      return {
        alternateVisible: isRendered(alternateShape),
        copyCenterIsInsidePanel,
        copyInStage: Boolean(copy && stage.contains(copy)),
        copyOverlapRatio: copyArea ? (overlapWidth * overlapHeight) / copyArea : 0,
        contentIsTopmost: Boolean(copy && topElement && copy.contains(topElement)),
        desktopShapeExists: Boolean(desktopShape?.querySelector('path')),
        expectedVisible: isRendered(expectedShape),
        headingIsLight: isLightText(heading),
        hasRealCopy: Boolean(heading?.textContent.trim() && intro?.textContent.trim()),
        introIsLight: isLightText(intro),
        imageCoversStage: Boolean(imageBox
          && Math.abs(imageBox.left - stageBox.left) <= 1
          && Math.abs(imageBox.top - stageBox.top) <= 1
          && Math.abs(imageBox.width - stageBox.width) <= 1
          && Math.abs(imageBox.height - stageBox.height) <= 1
          && getComputedStyle(image).objectFit === 'cover'),
        mobileShapeExists: Boolean(mobileShape?.querySelector('path')),
        panelAnchoredRight,
        panelCoversMiddle,
        panelFill: pinkPath ? getComputedStyle(pinkPath).fill : 'none',
        panelHeightRatio: shapeBox && stageBox.height ? shapeBox.height / stageBox.height : 0,
        panelLeavesImageVisibleLeft,
        panelWidthRatio: shapeBox && stageBox.width ? shapeBox.width / stageBox.width : 0,
        stageIsFullBleed: Math.abs(stageBox.left) <= 1
          && Math.abs(stageBox.top) <= 1
          && Math.abs(stageBox.right - innerWidth) <= 1
          && Math.abs(stageBox.height - innerHeight) <= 1,
      };
    }, mobile);

    if (!heroPanelState.desktopShapeExists || !heroPanelState.mobileShapeExists) {
      failures.push(`${name}: desktop or mobile curved hero SVG is missing its path`);
    }
    if (!heroPanelState.expectedVisible || heroPanelState.alternateVisible) {
      failures.push(`${name}: responsive hero SVG did not swap correctly`);
    }
    if (heroPanelState.panelFill !== 'rgb(214, 0, 98)') failures.push(`${name}: visible hero panel is not Empress pink`);
    if (heroPanelState.panelWidthRatio < .45 || heroPanelState.panelHeightRatio < .55) {
      failures.push(`${name}: pink hero panel is too small to form the intended large overlay`);
    }
    if (!heroPanelState.stageIsFullBleed || !heroPanelState.imageCoversStage) {
      failures.push(`${name}: salon image does not cover the full-bleed hero`);
    }
    if (!heroPanelState.panelAnchoredRight || !heroPanelState.panelCoversMiddle || !heroPanelState.panelLeavesImageVisibleLeft) {
      failures.push(`${name}: pink panel is not the intended oversized reverse-D anchored to the right`);
    }
    if (!heroPanelState.copyInStage || !heroPanelState.hasRealCopy) failures.push(`${name}: real hero copy is not inside the hero stage`);
    if (heroPanelState.copyOverlapRatio < .85 || !heroPanelState.copyCenterIsInsidePanel) {
      failures.push(`${name}: hero copy does not sit clearly inside the pink panel`);
    }
    if (!heroPanelState.headingIsLight || !heroPanelState.introIsLight || !heroPanelState.contentIsTopmost) {
      failures.push(`${name}: hero copy is not visibly legible above the pink panel`);
    }
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
console.log('✓ Loader, responsive hero panel, liquid navigation, branch contacts, white canvas, images, map tabs, booking, and WhatsApp routing passed');
