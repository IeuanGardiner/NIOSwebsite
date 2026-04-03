const SELECTORS = {
  include: '[data-include]',
  navContainer: 'nav',
  ctaAnchors: 'a.button[href^="#"]',
  reveal: '.reveal',
  menuToggle: '.menu-toggle',
  mobileNav: 'mobileNav',
  section: 'main section[id]',
  form: '.contact__form'
};

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
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((element) => observer.observe(element));
}

function setupActiveSectionTracking(d) {
  if (!('IntersectionObserver' in window)) return;

  const links = Array.from(d.querySelectorAll('.site-nav a[href^="#"], .mobile-menu a[href^="#"]'));
  const map = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const sections = Array.from(d.querySelectorAll(SELECTORS.section));
  if (!sections.length || !links.length) return;

  const updateCurrent = (id) => {
    links.forEach((link) => {
      if (link.getAttribute('href') === `#${id}`) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
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
  if (initial && map.has(initial)) {
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
    menu.toggleAttribute('hidden', !isOpen);
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
    focusFirstElement();
  };

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener('click', (event) => {
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

    const status = form.querySelector('[data-form-status]');
    if (status) {
      status.textContent = 'Thanks! We will get back to you within one business day.';
    }

    form.reset();
  });
}

function setupCardGlow(d) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  d.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--glow-x', `${x}%`);
      card.style.setProperty('--glow-y', `${y}%`);
    });
  });
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
  setupMobileMenu(d);
  setupContactForm(d);
  setupCardGlow(d);
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
    setupMobileMenu,
    setupContactForm,
    setupScrollAwareHeader,
    setupCardGlow
  };
}
