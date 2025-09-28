async function loadPartials() {
  const placeholders = Array.from(document.querySelectorAll('[data-include]'));
  await Promise.all(placeholders.map(async (placeholder) => {
    const src = placeholder.getAttribute('data-include');
    if (!src) {
      return;
    }

    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${src}: ${response.status}`);
      }
      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      placeholder.replaceWith(template.content.cloneNode(true));
    } catch (error) {
      console.error(error);
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

function initialiseSite() {
  const d = document;

  d.querySelectorAll('nav').forEach((nav) => nav.addEventListener('click', go));
  d.querySelectorAll('a.button[href^="#"]').forEach((anchor) => anchor.addEventListener('click', go));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    d.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  } else {
    d.querySelectorAll('.reveal').forEach((element) => element.classList.add('revealed'));
  }

  const toggle = d.querySelector('.menu-toggle');
  const menu = d.getElementById('mobileNav');
  if (toggle && menu) {
    const focusableSelector = 'a[href], button:not([disabled])';
    let focusableElements = [];
    let previouslyFocused;

    const setAria = (isOpen) => {
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.toggleAttribute('hidden', !isOpen);
      menu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const focusFirstElement = () => {
      focusableElements = Array.from(menu.querySelectorAll(focusableSelector));
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
      const isOutsidePanel = !event.target.closest('.mobile-drawer__panel');
      if (isOutsidePanel) {
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
        focusableElements = focusableElements.length ? focusableElements : Array.from(menu.querySelectorAll(focusableSelector));
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
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    await loadPartials();
    initialiseSite();
  });
}

// Export for testing in Node environment
if (typeof module !== 'undefined') {
  module.exports = { loadPartials, go, initialiseSite };
}
