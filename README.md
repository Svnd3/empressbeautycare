# Empress Beautycare

A polished, mobile-first website concept for Empress Beautycare’s three studios in Nairobi CBD and Ruiru.

The experience turns social discovery into a simple customer journey: understand the services, choose a branch, get directions, and send a complete appointment request to the correct WhatsApp number.

## Design reference

The supplied Apple archive was served from `www.apple.com/www.apple.com` and its Watch page was reviewed at desktop, tablet, and mobile widths. This build adapts its white canvas, light-gray grouping, wide content frame, product-card rhythm, compact chapter navigation, and responsive hierarchy without copying Apple code, fonts, or assets.

## What is included

- White, product-led responsive UI derived from the supplied local Apple snapshot, adapted for salon discovery and booking
- Service discovery for braids, locs, nails, skin/body care, and cuts/colour
- Clearly qualified “from” pricing based on recent published offers
- Individual cards, phone links, directions, and WhatsApp routing for all three branches
- Accessible booking dialog that builds a structured WhatsApp message
- Keyboard-friendly price tabs, mobile navigation, accordion FAQs, and reduced-motion support
- Asset-aware loading screen that releases after the local font and hero image are ready, with a fail-safe
- Local, licensed webfonts and compressed WebP media
- Organization and branch structured data for search engines
- Research, launch safeguards, and a complete cold-call package
- Automated source checks and browser-based desktop/mobile QA

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify

With the development server running:

```bash
npm run build
npm run check
npm run test:ui
```

`test:ui` uses the locally installed Google Chrome by default. Override it with `CHROME_PATH=/path/to/chrome` when necessary.

## Project notes

- [Research and suitability assessment](./docs/RESEARCH.md)
- [Cold-call and follow-up script](./docs/COLD-CALL-SCRIPT.md)
- [Media provenance and launch permissions](./docs/ASSET-PROVENANCE.md)

## Before a public launch

This repository is a sales-ready private concept, not yet an Empress-commissioned public website. Confirm the following with the business owner before deployment:

1. Written approval to reuse each image, plus photographer and identifiable client/model consent where applicable
2. Original high-resolution logo and salon photography to replace social thumbnail crops
3. Current prices, opening and closing times, and any happy-hour terms
4. Exact room notation for RNG Plaza (`OS3`) and each branch’s preferred directions link
5. Final domain, analytics/privacy choices, and the staff member responsible for updates

No assets, source code, or proprietary fonts from the supplied Apple or barbershop references are included in this build.
