const SELECTORS = {
  include: '[data-include]',
  navContainer: 'nav',
  ctaAnchors: 'a.button[href^="#"]',
  reveal: '.reveal',
  menuToggle: '.menu-toggle',
  mobileNav: 'mobileNav',
  section: 'main section[id]',
  form: '.contact__form',
  heroShot: '[data-hero-shot]'
};

// TODO: placeholder address until the Vesta domain exists. Keep in sync with
// the visible placeholders in contact.html and partials/footer.html.
const FALLBACK_EMAIL = 'hello@vesta-pm.example';

async function loadPartials(root = document) {
  const placeholders = Array.from(root.querySelectorAll(SELECTORS.include));

  await Promise.all(placeholders.map(async (placeholder) => {
    const src = placeholder.getAttribute('data-include');
    if (!src) return;

    try {
      const response = await fetch(src, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${src}: ${response.status}`);
      }

      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      placeholder.replaceWith(template.content.cloneNode(true));
    } catch (error) {
      console.error(error);
      placeholder.replaceWith(Object.assign(document.createElement('p'), {
        className: 'load-error',
        textContent: 'Some content could not be loaded. Please refresh the page.'
      }));
    }
  }));
}

function go(event) {
  const d = document;
  const header = d.querySelector('.site-header');
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor) return;

  const id = anchor.getAttribute('href').slice(1);
  if (!id) return;

  const safeId = (window.CSS && window.CSS.escape) ? window.CSS.escape(id) : id;
  const target = d.getElementById(id) || d.querySelector(`[id="${safeId}"]`);
  if (!target) return;

  event.preventDefault();
  const top = target.getBoundingClientRect().top + window.scrollY - ((header ? header.offsetHeight : 0) + 8);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function setupRevealOnScroll(d) {
  const revealTargets = d.querySelectorAll(SELECTORS.reveal);
  if (!revealTargets.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.willChange = 'transform, opacity';
        el.classList.add('revealed');
        el.addEventListener('transitionend', () => {
          el.style.willChange = 'auto';
        }, { once: true });
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((element) => observer.observe(element));
}

function setupActiveSectionTracking(d) {
  if (!('IntersectionObserver' in window)) return;

  const links = Array.from(d.querySelectorAll('.site-nav a[href^="#"], .mobile-menu a[href^="#"]'));
  const linksBySection = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (!linksBySection.has(id)) linksBySection.set(id, []);
    linksBySection.get(id).push(link);
  });
  const sections = Array.from(d.querySelectorAll(SELECTORS.section));
  if (!sections.length || !links.length) return;

  let currentId = null;
  const updateCurrent = (id) => {
    if (id === currentId) return;
    if (currentId) {
      (linksBySection.get(currentId) || []).forEach((link) => link.removeAttribute('aria-current'));
    }
    (linksBySection.get(id) || []).forEach((link) => link.setAttribute('aria-current', 'page'));
    currentId = id;
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visible[0]) {
      updateCurrent(visible[0].target.id);
    }
  }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-25% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));

  const initial = sections[0]?.id;
  if (initial && linksBySection.has(initial)) {
    updateCurrent(initial);
  }
}

function setupMobileMenu(d) {
  const toggle = d.querySelector(SELECTORS.menuToggle);
  const menu = d.getElementById(SELECTORS.mobileNav);

  if (!toggle || !menu) return;

  const focusableSelector = 'a[href], button:not([disabled])';
  let focusableElements = [];
  let previouslyFocused;

  const setAria = (isOpen) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.classList?.toggle('is-open', isOpen);
    menu.classList.toggle('open', isOpen);
    if (d.body && d.body.style) {
      d.body.style.overflow = isOpen ? 'hidden' : '';
    }
  };

  const refreshFocusable = () => {
    focusableElements = Array.from(menu.querySelectorAll(focusableSelector));
  };

  const focusFirstElement = () => {
    refreshFocusable();
    const first = focusableElements.find((el) => !el.hasAttribute('data-close')) || focusableElements[0];
    first?.focus({ preventScroll: true });
  };

  const closeMenu = (returnFocus = true) => {
    if (!menu.classList.contains('open')) return;
    setAria(false);
    if (returnFocus) {
      (previouslyFocused || toggle).focus({ preventScroll: true });
    }
  };

  const openMenu = () => {
    previouslyFocused = d.activeElement;
    setAria(true);
    window.setTimeout(focusFirstElement, 60);
  };

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener('click', (event) => {
    if (event.target === menu) {
      closeMenu();
      return;
    }

    const closeTarget = event.target.closest('[data-close]');
    if (closeTarget) {
      event.preventDefault();
      closeMenu();
      return;
    }

    const link = event.target.closest('a[href^="#"]');
    if (link) {
      closeMenu(false);
    }
  });

  d.addEventListener('keydown', (event) => {
    if (!menu.classList.contains('open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      refreshFocusable();
      if (!focusableElements.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && d.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && d.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function setupScrollAwareHeader(d) {
  const header = d.querySelector('.site-header');
  if (!header) return;

  const update = () => {
    if (window.scrollY > 10) {
      header.setAttribute('data-scrolled', '');
    } else {
      header.removeAttribute('data-scrolled');
    }
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

function setupContactForm(d) {
  const form = d.querySelector(SELECTORS.form);
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.reportValidity?.();
      return;
    }

    // Honeypot: quietly drop bot submissions.
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) return;

    // STUB BEHAVIOUR (no backend yet): compose the registration as an email
    // via the mailto: fallback. Swap this whole handler out once the form
    // `action` points at a real endpoint.
    const data = new FormData(form);
    const intent = data.get('intent') === 'book-demo' ? 'Book a demo' : 'Register interest';
    const lines = [
      `Name: ${data.get('name') || ''}`,
      `Work email: ${data.get('email') || ''}`,
      `Organisation: ${data.get('organisation') || ''}`,
      `Role: ${data.get('role') || ''}`,
      `Portfolio size: ${data.get('portfolio') || ''}`,
      '',
      data.get('message') || ''
    ];
    const mailto = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(`Vesta: ${intent}`)}&body=${encodeURIComponent(lines.join('\n'))}`;

    const status = form.querySelector('[data-form-status]');
    if (status) {
      status.textContent = `Opening your email client. If nothing happens, write to ${FALLBACK_EMAIL} directly.`;
    }

    window.location.href = mailto;
  });
}

function setupDarkModeToggle(d) {
  const toggle = d.getElementById('themeToggle');
  if (!toggle) return;

  const apply = (isDark) => {
    d.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  const isDark = d.documentElement.getAttribute('data-theme') === 'dark';
  apply(isDark);

  toggle.addEventListener('click', () => {
    const nowDark = d.documentElement.getAttribute('data-theme') !== 'dark';
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
    apply(nowDark);
  });
}

function setupScrollToTop(d) {
  const btn = d.getElementById('scrollTop');
  if (!btn) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
    btn.hidden = window.scrollY <= 600;
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

function setupActiveNavPage(d) {
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const links = d.querySelectorAll('.site-nav a[href], .mobile-menu a[href]:not(.button)');

  links.forEach((link) => {
    const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href && href === page) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function setupHeroSettle(d) {
  const shot = d.querySelector(SELECTORS.heroShot);
  if (!shot) return;

  const settle = () => shot.classList.add('is-settled');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    settle();
    return;
  }

  // Settle the perspective tilt once the shot is properly in view or the
  // visitor starts scrolling, whichever comes first.
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      settle();
      observer.disconnect();
    }
  }, { threshold: 0.55 });

  observer.observe(shot);
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      settle();
      observer.disconnect();
    }
  }, { passive: true, once: false });
}

function initialiseSite() {
  const d = document;

  d.querySelectorAll(SELECTORS.navContainer).forEach((nav) => nav.addEventListener('click', go));
  d.querySelectorAll(SELECTORS.ctaAnchors).forEach((anchor) => anchor.addEventListener('click', go));

  const yearElement = d.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  setupScrollAwareHeader(d);
  setupRevealOnScroll(d);
  setupActiveSectionTracking(d);
  setupActiveNavPage(d);
  setupHeroSettle(d);
  setupMobileMenu(d);
  setupDarkModeToggle(d);
  setupContactForm(d);
  setupScrollToTop(d);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    await loadPartials();
    initialiseSite();
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    loadPartials,
    go,
    initialiseSite,
    setupRevealOnScroll,
    setupActiveSectionTracking,
    setupActiveNavPage,
    setupHeroSettle,
    setupMobileMenu,
    setupDarkModeToggle,
    setupContactForm,
    setupScrollAwareHeader,
    setupScrollToTop
  };
}
