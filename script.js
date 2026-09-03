document.documentElement.classList.add('js');

const body = document.body;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const bookingDialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const bookingStatus = bookingForm?.querySelector('.form-status');

const branches = {
  rng: {
    label: 'RNG Plaza — Nairobi CBD',
    phone: '254720016178',
  },
  simara: {
    label: 'Simara Mall — Nairobi CBD',
    phone: '254720016178',
  },
  ruiru: {
    label: 'Morovian Mall — Ruiru',
    phone: '254796350593',
  },
};

const setHeaderState = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 18);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

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

primaryNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

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

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -7% 0px', threshold: 0.08 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = String(new Date().getFullYear());
});
