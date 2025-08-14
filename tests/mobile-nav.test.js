const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract mobile nav script from index.html
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf("const toggle = document.querySelector('.menu-toggle')");
const end = html.indexOf('\n})();', start);
if (start === -1 || end === -1) {
  throw new Error('mobile nav script not found in index.html');
}
const navSrc = html.slice(start, end);

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
      contains: name => menu.cls.has(name)
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
  global.document = {
    querySelector: sel => sel === '.menu-toggle' ? toggle : null,
    getElementById: id => id === 'mobileNav' ? menu : null,
    body
  };
  return {
    toggle,
    menu,
    body,
    clickToggle: () => btnClick && btnClick(),
    clickMenuLink: () => menuClick && menuClick({ target: { closest: () => ({}) } })
  };
}

test('button toggles menu visibility and body scroll', () => {
  const env = setup();
  eval(navSrc);
  env.clickToggle();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(env.menu.classList.contains('open'), true);
  assert.equal('hidden' in env.menu.attrs, false);
  assert.equal(env.body.style.overflow, 'hidden');
  assert.equal(env.toggle.textContent, '✕');
  env.clickToggle();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal('hidden' in env.menu.attrs, true);
  assert.equal(env.body.style.overflow, '');
  assert.equal(env.toggle.textContent, '☰');
});

test('clicking a menu link closes the menu', () => {
  const env = setup();
  eval(navSrc);
  env.clickToggle();
  env.clickMenuLink();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal('hidden' in env.menu.attrs, true);
  assert.equal(env.body.style.overflow, '');
  assert.equal(env.toggle.textContent, '☰');
});

