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
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.toggleAttribute('hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.hasAttribute('data-exit')) event.preventDefault();
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      menu.toggleAttribute('hidden', true);
      document.body.style.overflow = '';
    });
  }

  const track = d.querySelector('.carousel-track');
  if (track) {
    const slides = Array.from(track.children);
    const nextButton = d.getElementById('next');
    const prevButton = d.getElementById('prev');
    let currentSlide = 0;

    function updateSlide(position) {
      track.style.transform = `translateX(-${position * 100}%)`;
    }

    const advance = (direction = 1) => {
      currentSlide = (currentSlide + direction + slides.length) % slides.length;
      updateSlide(currentSlide);
    };

    nextButton?.addEventListener('click', () => advance(1));
    prevButton?.addEventListener('click', () => advance(-1));
    setInterval(() => advance(1), 5000);
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
