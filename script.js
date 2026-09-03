const body = document.body;
const siteLoader = document.querySelector('.site-loader');
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const navLiquid = document.querySelector('[data-nav-liquid]');
const bookingDialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const bookingStatus = bookingForm?.querySelector('.form-status');

body.classList.add('is-loading');
body.setAttribute('aria-busy', 'true');

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
const heroImage = document.querySelector('.hero-main-image img');
const heroReady = heroImage?.complete
  ? heroImage.decode?.().catch(() => undefined) ?? Promise.resolve()
  : new Promise((resolve) => {
      heroImage?.addEventListener('load', resolve, { once: true });
      heroImage?.addEventListener('error', resolve, { once: true });
    });
const fontsReady = document.fonts?.ready ?? Promise.resolve();

Promise.all([
  Promise.race([Promise.all([fontsReady, heroReady]), wait(2500)]),
  wait(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280),
]).then(() => {
  siteLoader?.classList.add('is-complete');
  body.classList.remove('is-loading');
  body.setAttribute('aria-busy', 'false');
  window.setTimeout(() => siteLoader?.remove(), 260);
});

const branches = {
  rng: {
    name: 'RNG Plaza',
    city: 'Nairobi CBD',
    label: 'RNG Plaza — Nairobi CBD',
    address: 'Ronald Ngala Street — 4th floor, Room OS3',
    phone: '254720016178',
    phoneDisplay: '0720 016 178',
    map: 'https://www.openstreetmap.org/export/embed.html?bbox=36.8205%2C-1.292%2C36.835%2C-1.278&layer=mapnik',
    mapTitle: 'Map showing the Ronald Ngala Street area around Empress Beautycare at RNG Plaza',
    mapNote: 'Area view — use directions for the exact entrance',
    directions: 'https://www.google.com/maps/search/?api=1&query=Empress%20BeautyCare%2C%20RNG%20Plaza%2C%20Ronald%20Ngala%20Street%2C%20Nairobi%2C%20Kenya',
  },
  simara: {
    name: 'Simara Mall',
    city: 'Nairobi CBD',
    label: 'Simara Mall — Nairobi CBD',
    address: 'Opp. National Archives — 7th floor, Room 8',
    phone: '254720016178',
    phoneDisplay: '0720 016 178',
    map: 'https://www.openstreetmap.org/export/embed.html?bbox=36.819%2C-1.291%2C36.833%2C-1.277&layer=mapnik&marker=-1.2840661%2C36.8260166',
    mapTitle: 'Map showing Empress Beautycare at Simara Mall',
    mapNote: 'Mall pin',
    directions: 'https://www.google.com/maps/search/?api=1&query=Empress%20BeautyCare%2C%20Simara%20Mall%2C%20Tom%20Mboya%20Street%2C%20Nairobi%2C%20Kenya',
  },
  ruiru: {
    name: 'Morovian Mall',
    city: 'Ruiru',
    label: 'Morovian Mall — Ruiru',
    address: 'Next to Zetech University — 1st floor, Room 16',
    phone: '254796350593',
    phoneDisplay: '0796 350 593',
    map: 'https://www.openstreetmap.org/export/embed.html?bbox=36.953%2C-1.160%2C36.970%2C-1.146&layer=mapnik&marker=-1.1533409%2C36.9617807',
    mapTitle: 'Map showing Empress Beautycare at Morovian Mall',
    mapNote: 'Mall pin',
    directions: 'https://www.google.com/maps/search/?api=1&query=Empress%20BeautyCare%2C%20Morovian%20Mall%2C%20Ruiru%2C%20Kenya',
  },
};

let headerLayoutFrame;
const setHeaderState = () => {
  const shouldBeScrolled = window.scrollY > 18;
  const layoutChanged = header?.classList.contains('is-scrolled') !== shouldBeScrolled;
  header?.classList.toggle('is-scrolled', shouldBeScrolled);

  if (layoutChanged && activeNavigationLink && !mobileNavigation.matches) {
    window.cancelAnimationFrame(headerLayoutFrame);
    headerLayoutFrame = window.requestAnimationFrame(() => moveNavLiquid(activeNavigationLink, false));
  }
};

const closeMenu = () => {
  body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  const menuLabel = menuToggle?.querySelector('.sr-only');
  if (menuLabel) menuLabel.textContent = 'Open menu';
};

menuToggle?.addEventListener('click', () => {
  const nextState = !body.classList.contains('menu-open');
  body.classList.toggle('menu-open', nextState);
  menuToggle.setAttribute('aria-expanded', String(nextState));
  menuToggle.querySelector('.sr-only').textContent = nextState ? 'Close menu' : 'Open menu';
});

const navigationLinks = [...(primaryNav?.querySelectorAll('a[href^="#"]') ?? [])];
const navigationSections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileNavigation = window.matchMedia('(max-width: 980px)');
let activeNavigationLink = navigationLinks.find((link) => link.getAttribute('aria-current') === 'true') ?? null;
let navLiquidAnimation = null;
let navigationClickLockUntil = 0;

const getNavBox = (element) => {
  const navBox = primaryNav.getBoundingClientRect();
  const elementBox = element.getBoundingClientRect();
  return {
    height: elementBox.height,
    left: elementBox.left - navBox.left,
    top: elementBox.top - navBox.top,
    width: elementBox.width,
  };
};

const setNavLiquidBox = ({ height, left, top, width }) => {
  if (!navLiquid) return;
  navLiquid.style.height = `${height}px`;
  navLiquid.style.left = `${left}px`;
  navLiquid.style.top = `${top}px`;
  navLiquid.style.width = `${width}px`;
};

const moveNavLiquid = (nextLink, animate = true) => {
  if (!nextLink) return;

  const previousLink = activeNavigationLink;
  navigationLinks.forEach((link) => {
    if (link === nextLink) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  activeNavigationLink = nextLink;

  if (!primaryNav || !navLiquid || mobileNavigation.matches || !nextLink.getClientRects().length) return;

  const targetBox = getNavBox(nextLink);
  const canAnimate = animate
    && !reducedMotion.matches
    && typeof navLiquid.animate === 'function';
  const liquidIsVisible = navLiquid.style.opacity === '1';

  if (navLiquidAnimation) {
    const navBox = primaryNav.getBoundingClientRect();
    const renderedBox = navLiquid.getBoundingClientRect();
    setNavLiquidBox({
      height: renderedBox.height,
      left: renderedBox.left - navBox.left,
      top: renderedBox.top - navBox.top,
      width: renderedBox.width,
    });
    navLiquidAnimation.cancel();
    navLiquidAnimation = null;
  }
  primaryNav.classList.remove('is-liquid-moving');

  primaryNav.classList.add('is-liquid-ready');
  navLiquid.style.opacity = '1';

  if (!canAnimate || !previousLink || previousLink === nextLink) {
    setNavLiquidBox(targetBox);
    navLiquid.style.transform = 'none';
    if (canAnimate && !liquidIsVisible) {
      navLiquidAnimation = navLiquid.animate([
        { opacity: 0, transform: 'scale(.72)' },
        { opacity: 1, transform: 'scale(1.08, .92)', offset: .66 },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 440, easing: 'cubic-bezier(.2, .9, .25, 1)', fill: 'both' });
      navLiquidAnimation.onfinish = () => {
        navLiquid.style.opacity = '1';
        navLiquid.style.transform = 'none';
        navLiquidAnimation?.cancel();
        navLiquidAnimation = null;
      };
    }
    return;
  }

  const navBox = primaryNav.getBoundingClientRect();
  const renderedBox = navLiquid.getBoundingClientRect();
  const startBox = liquidIsVisible
    ? {
        height: renderedBox.height,
        left: renderedBox.left - navBox.left,
        top: renderedBox.top - navBox.top,
        width: renderedBox.width,
      }
    : getNavBox(previousLink);
  const bridgeLeft = Math.min(startBox.left, targetBox.left);
  const bridgeRight = Math.max(startBox.left + startBox.width, targetBox.left + targetBox.width);
  const direction = targetBox.left >= startBox.left ? 1 : -1;

  setNavLiquidBox(startBox);
  primaryNav.classList.add('is-liquid-moving');
  navLiquidAnimation = navLiquid.animate([
    {
      height: `${startBox.height}px`,
      left: `${startBox.left}px`,
      top: `${startBox.top}px`,
      transform: 'scale(1)',
      width: `${startBox.width}px`,
    },
    {
      height: `${Math.max(startBox.height, targetBox.height)}px`,
      left: `${bridgeLeft}px`,
      offset: .44,
      top: `${Math.min(startBox.top, targetBox.top)}px`,
      transform: 'scaleY(.78)',
      width: `${bridgeRight - bridgeLeft}px`,
    },
    {
      height: `${targetBox.height}px`,
      left: `${targetBox.left + (direction * 7)}px`,
      offset: .73,
      top: `${targetBox.top}px`,
      transform: 'scale(.9, 1.13)',
      width: `${targetBox.width}px`,
    },
    {
      height: `${targetBox.height}px`,
      left: `${targetBox.left - (direction * 2)}px`,
      offset: .88,
      top: `${targetBox.top}px`,
      transform: 'scale(1.035, .97)',
      width: `${targetBox.width}px`,
    },
    {
      height: `${targetBox.height}px`,
      left: `${targetBox.left}px`,
      top: `${targetBox.top}px`,
      transform: 'scale(1)',
      width: `${targetBox.width}px`,
    },
  ], { duration: 680, easing: 'cubic-bezier(.2, .84, .22, 1)', fill: 'both' });

  navLiquidAnimation.onfinish = () => {
    setNavLiquidBox(targetBox);
    navLiquid.style.opacity = '1';
    navLiquid.style.transform = 'none';
    primaryNav.classList.remove('is-liquid-moving');
    navLiquidAnimation?.cancel();
    navLiquidAnimation = null;
  };
};

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navigationClickLockUntil = performance.now() + 1400;
    moveNavLiquid(link);
    closeMenu();
  });
});

if ('IntersectionObserver' in window) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (!visible || performance.now() < navigationClickLockUntil) return;
    const matchingLink = navigationLinks.find((link) => link.getAttribute('href') === `#${visible.target.id}`);
    if (matchingLink) moveNavLiquid(matchingLink);
  }, { rootMargin: '-28% 0px -56%', threshold: [0, .2, .5] });

  navigationSections.forEach((section) => navigationObserver.observe(section));
}

let navResizeFrame;
window.addEventListener('resize', () => {
  window.cancelAnimationFrame(navResizeFrame);
  navResizeFrame = window.requestAnimationFrame(() => {
    if (activeNavigationLink && !mobileNavigation.matches) moveNavLiquid(activeNavigationLink, false);
  });
}, { passive: true });

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

const openBooking = (trigger) => {
  closeMenu();

  const branch = trigger?.dataset.branch;
  const service = trigger?.dataset.service;
  const branchSelect = bookingForm?.elements.branch;
  const serviceSelect = bookingForm?.elements.service;

  if (branch && branchSelect) branchSelect.value = branch;
  if (service && serviceSelect) serviceSelect.value = service;
  if (bookingStatus) bookingStatus.textContent = '';

  if (typeof bookingDialog?.showModal === 'function') {
    bookingDialog.showModal();
  } else {
    bookingDialog?.setAttribute('open', '');
  }

  body.classList.add('dialog-open');
  window.setTimeout(() => bookingForm?.elements.name?.focus(), 80);
};

const closeBooking = () => {
  if (typeof bookingDialog?.close === 'function') {
    bookingDialog.close();
  } else {
    bookingDialog?.removeAttribute('open');
  }
  body.classList.remove('dialog-open');
};

document.querySelectorAll('[data-open-booking]').forEach((button) => {
  button.addEventListener('click', () => openBooking(button));
});

document.querySelectorAll('[data-close-booking]').forEach((button) => {
  button.addEventListener('click', closeBooking);
});

bookingDialog?.addEventListener('close', () => body.classList.remove('dialog-open'));
bookingDialog?.addEventListener('click', (event) => {
  if (event.target === bookingDialog) closeBooking();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('menu-open')) closeMenu();
});

const dateInput = bookingForm?.elements.date;
if (dateInput) {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
  dateInput.min = localDate;
}

const formatDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day, 12));
};

const formatTime = (value) => {
  if (!value) return 'Flexible';
  const [hour, minute] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2020, 0, 1, hour, minute));
};

bookingForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!bookingForm.reportValidity()) {
    if (bookingStatus) bookingStatus.textContent = 'Please complete the required details above.';
    return;
  }

  const data = new FormData(bookingForm);
  const selectedBranch = branches[data.get('branch')];
  const notes = String(data.get('notes') || '').trim();
  const lines = [
    'Hello Empress Beautycare 👋',
    '',
    `My name is ${data.get('name')}. I would like to request an appointment:`,
    '',
    `• Branch: ${selectedBranch.label}`,
    `• Service: ${data.get('service')}`,
    `• Date: ${formatDate(data.get('date'))}`,
    `• Preferred time: ${formatTime(data.get('time'))}`,
  ];

  if (notes) lines.push(`• Notes: ${notes}`);
  lines.push('', 'Please confirm availability and the final price. Thank you.');

  const whatsappUrl = `https://wa.me/${selectedBranch.phone}?text=${encodeURIComponent(lines.join('\n'))}`;
  if (bookingStatus) bookingStatus.textContent = 'Opening WhatsApp with your request…';
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
});

const priceTabs = [...document.querySelectorAll('[data-price-tab]')];
const pricePanels = [...document.querySelectorAll('[data-price-panel]')];

const activatePriceTab = (tab, focus = false) => {
  const category = tab.dataset.priceTab;
  priceTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  pricePanels.forEach((panel) => {
    panel.hidden = panel.dataset.pricePanel !== category;
  });
  if (focus) tab.focus();
};

priceTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activatePriceTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % priceTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + priceTabs.length) % priceTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = priceTabs.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      activatePriceTab(priceTabs[nextIndex], true);
    }
  });
});

const mapTabs = [...document.querySelectorAll('[data-map-tab]')];
const mapFrame = document.querySelector('[data-branch-map]');
const mapCity = document.querySelector('[data-map-city]');
const mapName = document.querySelector('[data-map-name]');
const mapAddress = document.querySelector('[data-map-address]');
const mapNote = document.querySelector('[data-map-note]');
const mapCall = document.querySelector('[data-map-call]');
const mapDirections = document.querySelector('[data-map-directions]');
const mapBooking = document.querySelector('[data-map-booking]');
const mapLoading = document.querySelector('[data-map-loading]');
let mapReadyTimer;

const showMapLoading = () => {
  window.clearTimeout(mapReadyTimer);
  mapLoading?.classList.remove('is-hidden');
  mapFrame?.classList.remove('is-ready');
};

const finishMapLoading = () => {
  window.clearTimeout(mapReadyTimer);
  mapReadyTimer = window.setTimeout(() => {
    mapLoading?.classList.add('is-hidden');
    mapFrame?.classList.add('is-ready');
  }, 1100);
};

mapFrame?.addEventListener('load', finishMapLoading);

const activateMapTab = (tab, focus = false) => {
  const branchKey = tab.dataset.mapTab;
  const location = branches[branchKey];
  if (!location) return;

  mapTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-pressed', String(selected));
  });

  if (mapFrame && mapFrame.src !== location.map) {
    showMapLoading();
    mapFrame.src = location.map;
    mapFrame.title = location.mapTitle;
  }
  if (mapCity) mapCity.textContent = location.city;
  if (mapName) mapName.textContent = location.name;
  if (mapAddress) mapAddress.textContent = location.address;
  if (mapNote) mapNote.textContent = location.mapNote;
  if (mapCall) {
    mapCall.href = `tel:+${location.phone}`;
    mapCall.textContent = `Call ${location.phoneDisplay}`;
  }
  if (mapDirections) mapDirections.href = location.directions;
  if (mapBooking) mapBooking.dataset.branch = branchKey;
  if (focus) tab.focus();
};

mapTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateMapTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % mapTabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + mapTabs.length) % mapTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = mapTabs.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      activateMapTab(mapTabs[nextIndex], true);
    }
  });
});

const serviceScroller = document.querySelector('[data-scroller]');
document.querySelectorAll('[data-scroll]').forEach((control) => {
  control.addEventListener('click', () => {
    const direction = control.dataset.scroll === 'forward' ? 1 : -1;
    const card = serviceScroller?.querySelector('.service-card');
    const distance = card ? card.getBoundingClientRect().width + 18 : 380;
    serviceScroller?.scrollBy({ left: distance * direction, behavior: 'smooth' });
  });
});

document.querySelectorAll('.faq-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-list details').forEach((other) => {
      if (other !== item) other.removeAttribute('open');
    });
  });
});

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});
