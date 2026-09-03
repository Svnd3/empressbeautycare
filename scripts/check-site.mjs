import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const requiredFiles = [
  'index.html',
  'styles.css',
  'script.js',
  'public/favicon.svg',
  'public/images/salon.webp',
  'public/images/braids.webp',
  'public/images/twists.webp',
  'public/images/locs.webp',
  'public/images/nails.webp',
  'public/images/haircut.webp',
  'dist/index.html',
];

for (const file of requiredFiles) await access(resolve(root, file));

const html = await readFile(resolve(root, 'index.html'), 'utf8');
const script = await readFile(resolve(root, 'script.js'), 'utf8');
const problems = [];

for (const text of ['RNG Plaza', 'Simara Mall', 'Morovian Mall', '254720016178', '254796350593']) {
  if (!html.includes(text) && !script.includes(text)) problems.push(`Missing required business detail: ${text}`);
}

if (/href=["']#["']/.test(html)) problems.push('Found a dead href="#" link.');
if (/\b(TODO|Lorem ipsum|placeholder copy)\b/i.test(html)) problems.push('Found unfinished placeholder copy.');
if (!html.includes('data-open-booking')) problems.push('Booking triggers are missing.');
if (!html.includes('application/ld+json')) problems.push('Structured business data is missing.');

if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'));
  process.exit(1);
}

console.log(`✓ ${requiredFiles.length} required files found`);
console.log('✓ Branch, contact, booking, and structured-data checks passed');
