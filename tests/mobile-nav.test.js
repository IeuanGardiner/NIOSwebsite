const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract mobile nav script from index.html
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf("const menuBtn = document.getElementById('menuToggle')");
const end = html.indexOf('\n})();', start);
if (start === -1 || end === -1) {
  throw new Error('mobile nav script not found in index.html');
}
const navSrc = html.slice(start, end);

function setup() {
  let btnClick;
  let navClick;
  const menuBtn = {
    attrs: { 'aria-expanded': 'false' },
    addEventListener: (type, fn) => { if (type === 'click') btnClick = fn; },
    getAttribute: name => menuBtn.attrs[name],
    setAttribute: (name, value) => { menuBtn.attrs[name] = value; }
  };
  const mobileNav = {
    hidden: true,
    addEventListener: (type, fn) => { if (type === 'click') navClick = fn; }
  };
  global.document = {
    getElementById: id => {
      if (id === 'menuToggle') return menuBtn;
      if (id === 'mobileNav') return mobileNav;
      return null;
    }
  };
  return {
    menuBtn,
    mobileNav,
    clickToggle: () => btnClick && btnClick(),
    clickLink: () => navClick && navClick({ target: { closest: () => ({}) } })
  };
}

test('button toggles hidden and aria-expanded', () => {
  const env = setup();
  eval(navSrc);
  env.clickToggle();
  assert.equal(env.menuBtn.getAttribute('aria-expanded'), 'true');
  assert.equal(env.mobileNav.hidden, false);
  env.clickToggle();
  assert.equal(env.menuBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(env.mobileNav.hidden, true);
});

test('link click closes menu', () => {
  const env = setup();
  eval(navSrc);
  env.clickToggle();
  env.clickLink();
  assert.equal(env.menuBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(env.mobileNav.hidden, true);
});
