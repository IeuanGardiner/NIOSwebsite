const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { initialiseSite } = require(path.join('..', 'scripts', 'main.js'));

function setup() {
  let btnClick, menuClick;
  const toggle = {
    attrs: { 'aria-expanded': 'false' },
    textContent: '☰',
    addEventListener: (type, fn) => { if (type === 'click') btnClick = fn; },
    getAttribute: name => toggle.attrs[name],
    setAttribute: (name, value) => { toggle.attrs[name] = value; }
  };
  const menu = {
    attrs: { hidden: '' },
    cls: new Set(),
    classList: {
      toggle: name => {
        if (menu.cls.has(name)) { menu.cls.delete(name); return false; }
        menu.cls.add(name); return true;
      },
      contains: name => menu.cls.has(name),
      remove: name => menu.cls.delete(name)
    },
    toggleAttribute: (name, force) => {
      if (force === undefined) {
        if (name in menu.attrs) { delete menu.attrs[name]; return false; }
        menu.attrs[name] = ''; return true;
      }
      if (force) { menu.attrs[name] = ''; return true; }
      delete menu.attrs[name]; return false;
    },
    addEventListener: (type, fn) => { if (type === 'click') menuClick = fn; }
  };
  const body = { style: {} };
  const navElement = { addEventListener: () => {} };
  global.document = {
    querySelector: sel => sel === '.menu-toggle' ? toggle : null,
    querySelectorAll: (selector) => {
      if (selector === 'nav') return [navElement];
      if (selector === 'a.button[href^="#"]') return [];
      if (selector === '.reveal') return [];
      return [];
    },
    getElementById: id => id === 'mobileNav' ? menu : null,
    body
  };
  global.window = {
    matchMedia: () => ({ matches: false })
  };
  initialiseSite();
  return {
    toggle,
    menu,
    body,
    clickToggle: () => btnClick && btnClick(),
    clickMenuLink: () => menuClick && menuClick({ target: { closest: () => ({ hasAttribute: () => false }) } }),
    clickExitLink: () => {
      let prevented = false;
      menuClick && menuClick({
        target: { closest: () => ({ hasAttribute: attr => attr === 'data-exit' }) },
        preventDefault: () => { prevented = true; }
      });
      return { prevented };
    }
  };
}

test('button toggles menu visibility and body scroll', () => {
  const env = setup();
  env.clickToggle();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(env.menu.classList.contains('open'), true);
  assert.equal('hidden' in env.menu.attrs, false);
  assert.equal(env.body.style.overflow, 'hidden');
  assert.equal(env.toggle.textContent, '☰');
  env.clickToggle();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal('hidden' in env.menu.attrs, true);
  assert.equal(env.body.style.overflow, '');
  assert.equal(env.toggle.textContent, '☰');
});

test('clicking a menu link closes the menu', () => {
  const env = setup();
  env.clickToggle();
  env.clickMenuLink();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal('hidden' in env.menu.attrs, true);
  assert.equal(env.body.style.overflow, '');
  assert.equal(env.toggle.textContent, '☰');
});

test('clicking the exit link closes the menu without navigation', () => {
  const env = setup();
  env.clickToggle();
  const res = env.clickExitLink();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal('hidden' in env.menu.attrs, true);
  assert.equal(env.body.style.overflow, '');
  assert.equal(env.toggle.textContent, '☰');
  assert.equal(res.prevented, true);
});

