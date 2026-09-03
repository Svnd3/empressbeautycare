# Empress Beautycare

A polished, mobile-first website concept for Empress Beautycare’s three studios in Nairobi CBD and Ruiru.

The experience turns social discovery into a simple customer journey: understand the services, choose a branch, get directions, and send a complete appointment request to the correct WhatsApp number.

## Design reference

The supplied Apple archive was served from `www.apple.com/www.apple.com` and its Watch page was reviewed at desktop, tablet, and mobile widths. This build adapts its white canvas, light-gray grouping, wide content frame, product-card rhythm, compact chapter navigation, and responsive hierarchy without copying Apple code, fonts, or assets.

## What is included

- White, product-led responsive UI derived from the supplied local Apple snapshot, adapted for salon discovery and booking
- Full-bleed salon hero with an oversized Empress-pink reverse-D panel anchored to the right, separate desktop/mobile SVG geometry, and readable content layered inside it
- Supplied Empress logo lockup in the navigation, with its woman mark used for the loader and favicon
- Pink active navigation pill with a liquid, bouncy hand-off between desktop section links and a clear filled state on mobile
- Service discovery for braids, locs, nails, skin/body care, and cuts/colour
- Clearly qualified “from” pricing based on recent published offers
- Individual cards, phone links, directions, and WhatsApp routing for all three branches
- Branch contact cards with phone, Instagram, TikTok, and Facebook icons; branch-specific accounts are used where verified, while shared brand accounts are labelled honestly
- Interactive, keyboard-friendly branch tabs with an embedded map and location-specific actions
- Real, source-linked public TikTok comments without invented stars or ratings
- Accessible booking dialog that builds a structured WhatsApp message
- Plain-language service, location, and booking labels with ornamental numeric counters removed; factual prices, phone numbers, room numbers, and dates remain intact
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

- Written approval to reuse each image, plus photographer and identifiable client/model consent where applicable
- Original high-resolution logo and salon photography to replace social thumbnail crops
- Current prices, opening and closing times, and any happy-hour terms
- Exact room notation for RNG Plaza (`OS3`) and each branch’s preferred directions link
- Final domain, analytics/privacy choices, and the staff member responsible for updates

No assets, source code, or proprietary fonts from the supplied Apple or barbershop references are included in this build.
