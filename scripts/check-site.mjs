import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const requiredFiles = [
  'index.html',
  'styles.css',
  'script.js',
  'public/images/empress-logo.png',
  'public/images/empress-icon.png',
  'public/images/salon.webp',
  'public/images/braids.webp',
  'public/images/twists.webp',
  'public/images/locs.webp',
  'public/images/nails.webp',
  'public/images/haircut.webp',
  'public/images/knotless-process.webp',
  'public/images/nail-service.webp',
  'public/images/massage.webp',
  'public/images/salon-team.webp',
  'public/images/finished-twists.webp',
  'public/images/two-strand-locs.webp',
  'public/images/protective-braids.webp',
  'dist/index.html',
];

for (const file of requiredFiles) await access(resolve(root, file));

const html = await readFile(resolve(root, 'index.html'), 'utf8');
const script = await readFile(resolve(root, 'script.js'), 'utf8');
const styles = await readFile(resolve(root, 'styles.css'), 'utf8');
const problems = [];

for (const text of ['RNG Plaza', 'Simara Mall', 'Morovian Mall', '254720016178', '254796350593']) {
  if (!html.includes(text) && !script.includes(text)) problems.push(`Missing required business detail: ${text}`);
}

if (/href=["']#["']/.test(html)) problems.push('Found a dead href="#" link.');
if (/\b(TODO|Lorem ipsum|placeholder copy)\b/i.test(html)) problems.push('Found unfinished placeholder copy.');
if (!html.includes('data-open-booking')) problems.push('Booking triggers are missing.');
if (!html.includes('application/ld+json')) problems.push('Structured business data is missing.');
if (!html.includes('<h2>Services</h2>') || !html.includes('<h2>Pricing</h2>') || !html.includes('<h2>Our works</h2>')) {
  problems.push('The simplified section headings are missing.');
}
if (!html.includes('From the Empress chair') || !html.includes('Public TikTok comment')) {
  problems.push('The sourced customer-comment section is missing.');
}
if (!html.includes('data-branch-map') || !script.includes('activateMapTab')) {
  problems.push('The interactive branch map is missing.');
}
if (/class=["'][^"']*(pink-dot|decorative-dot)/i.test(html)) problems.push('A decorative pink dot remains.');
if (styles.includes('.eyebrow::before')) problems.push('A decorative heading dot remains in the stylesheet.');
if (html.includes('·')) problems.push('A middle-dot separator remains in the interface.');
if (/[←→↗↘↖↙➜➝➞➟➠➡➢➤]/u.test(html)) problems.push('A visible arrow glyph remains in the interface.');
if (/<button[^>]*class=["'][^"']*form-submit[^"']*["'][^>]*>(?:(?!<\/button>)[\s\S])*?<svg/i.test(html)) problems.push('The WhatsApp submit button still contains a trailing arrow icon.');
const requestButtons = html.match(/class="card-link"[^>]*>Request this<\/button>/g) ?? [];
if (requestButtons.length !== 5) problems.push(`Expected 5 simplified service request buttons, found ${requestButtons.length}.`);
const workCards = html.match(/class="lookbook-item[^"']*"/g) ?? [];
if (workCards.length < 12) problems.push(`Expected at least 12 work images, found ${workCards.length}.`);
if (!html.includes('class="site-loader"') || !script.includes("siteLoader?.classList.add('is-complete')")) {
  problems.push('The loading screen or its asset-ready dismissal is missing.');
}
if (!html.includes('data-map-loading') || !styles.includes('.map-loading.is-hidden')) {
  problems.push('The map loading state is missing.');
}
if (html.includes('Three studios')) {
  problems.push('The removed hero studio-count phrase is still present.');
}
if (html.includes('hero-wave') || styles.includes('.hero-wave') || /@keyframes\s+hero-wave/i.test(styles)) {
  problems.push('The superseded thin hero wave is still present.');
}
if (!/class="[^"]*\bhero-stage\b[^"]*"/.test(html)
    || !/<svg[^>]+class="[^"]*\bhero-panel-shape--desktop\b[^"]*"/i.test(html)
    || !/<svg[^>]+class="[^"]*\bhero-panel-shape--mobile\b[^"]*"/i.test(html)) {
  problems.push('The responsive curved hero panel structure is missing.');
}
if (!styles.includes('.hero-panel-shape') || !styles.includes('.hero-panel-shape--desktop') || !styles.includes('.hero-panel-shape--mobile')) {
  problems.push('The responsive curved hero panel styles are missing.');
}
if (!/\.hero-panel-shape[\s\S]{0,600}(?:fill|color):\s*var\(--pink\)/i.test(styles)
    && !/hero-panel-shape[\s\S]{0,600}<path[^>]+fill=["'](?:#d60062|var\(--pink\))["']/i.test(html)) {
  problems.push('The curved hero SVG is not explicitly connected to the Empress pink token.');
}
const heroStageStart = html.search(/class="[^"]*\bhero-stage\b[^"]*"/);
const heroStageSectionEnd = heroStageStart >= 0 ? html.indexOf('</section>', heroStageStart) : -1;
const heroStageMarkup = heroStageStart >= 0 && heroStageSectionEnd >= 0
  ? html.slice(heroStageStart, heroStageSectionEnd)
  : '';
if (!/class="[^"]*\bhero-copy\b[^"]*"/.test(heroStageMarkup)) {
  problems.push('The real hero copy is not inside the hero stage.');
}
if (!html.includes('data-nav-liquid') || !styles.includes('.nav-liquid') || !script.includes('navLiquid') || !script.includes('.animate(')) {
  problems.push('The liquid active-navigation fill or its motion is missing.');
}

const branchContactCards = html.match(/class="[^"]*\bbranch-contact-card\b[^"]*"/g) ?? [];
if (branchContactCards.length !== 3) {
  problems.push(`Expected 3 branch contact cards, found ${branchContactCards.length}.`);
}

const contactMethods = html.match(/class="[^"]*\bcontact-method\b[^"]*"/g) ?? [];
if (contactMethods.length !== 12) {
  problems.push(`Expected 12 branch contact methods, found ${contactMethods.length}.`);
}

for (const destination of [
  'tel:+254720016178',
  'tel:+254796350593',
  'instagram.com/empressbeautycare/',
  'instagram.com/empress_beautycare_2/',
  'tiktok.com/@empressbeautycare',
  'tiktok.com/@empressbeautycare2',
  'tiktok.com/@empressbeautycare3',
  'facebook.com/p/Empress-BeautyCare-100070468808845/',
  'facebook.com/p/Empress-Beautycare-2-100044461598491/',
]) {
  if (!html.includes(destination)) problems.push(`Missing branch contact destination: ${destination}`);
}

for (const icon of ['phone', 'instagram', 'facebook', 'tiktok']) {
  if (!html.includes(`href="#icon-${icon}"`)) problems.push(`Missing ${icon} icon in branch contact links.`);
}

if (/>\s*0[1-9]\s*</.test(html) || /<p>\s*0[1-9]\s*\//i.test(html)) {
  problems.push('An ornamental numeric counter remains in the interface.');
}
if (html.includes('Three quick steps.')) problems.push('The numbered booking-step heading remains.');
if (html.includes('Room F16') || script.includes('Room F16')) problems.push('The old Ruiru room notation remains.');
if (!styles.includes('--white: #fff') || !styles.includes('--pink: #d60062')) {
  problems.push('The white-and-pink design tokens are missing.');
}

if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exit(1);
}

console.log(`✓ ${requiredFiles.length} required files found`);
console.log('✓ Content, branch contacts, liquid navigation, responsive hero panel, booking, map, loader, brand, and design checks passed');
