const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { initialiseSite } = require(path.join('..', 'scripts', 'main.js'));

function createClassList() {
  const classes = new Set();
  return {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name),
    toggle: (name, force) => {
      if (typeof force === 'boolean') {
        if (force) {
          classes.add(name);
          return true;
        }
        classes.delete(name);
        return false;
      }
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    }
  };
}

function createFocusable(tagName, attrs = {}) {
  return {
    tagName: tagName.toUpperCase(),
    attrs: { ...attrs },
    focusCalled: false,
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name);
    },
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    getAttribute(name) {
      return this.attrs[name];
    },
    focus() {
      this.focusCalled = true;
      documentStub.activeElement = this;
    },
    closest(selector) {
      if (selector === '[data-close]' && this.hasAttribute('data-close')) {
        return this;
      }
      if (selector === '.mobile-drawer__panel') {
        return panel;
      }
      if (selector === 'a[href^="#"]' && this.tagName === 'A' && typeof this.attrs.href === 'string' && this.attrs.href.startsWith('#')) {
        return this;
      }
      return null;
    }
  };
}

const panel = { name: 'panel' };

function setup() {
  let toggleClick;
  let menuClick;
  let keydownHandler;

  const toggle = createFocusable('button', { 'aria-controls': 'mobileNav', 'aria-expanded': 'false' });
  toggle.addEventListener = (type, fn) => { if (type === 'click') toggleClick = fn; };

  const closeButton = createFocusable('button', { 'data-close': '' });
  const navLink = createFocusable('a', { href: '#services' });
  const exitLink = createFocusable('a', { href: '#', 'data-close': '', 'data-exit': '' });

  const focusables = [closeButton, navLink, exitLink];

  const menu = {
    attrs: { hidden: '' },
    classList: createClassList(),
    toggleAttribute(name, force) {
      if (typeof force === 'boolean') {
        if (force) {
          this.attrs[name] = '';
          return true;
        }
        delete this.attrs[name];
        return false;
      }
      if (this.attrs[name] !== undefined) {
        delete this.attrs[name];
        return false;
      }
      this.attrs[name] = '';
      return true;
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name);
    },
    addEventListener: (type, fn) => { if (type === 'click') menuClick = fn; },
    querySelectorAll: (selector) => {
      if (selector === 'a[href], button:not([disabled])') {
        return focusables;
      }
      return [];
    }
  };

  const navElement = { addEventListener: () => {} };

  global.document = documentStub = {
    body: { style: {} },
    _activeElement: toggle,
    get activeElement() {
      return this._activeElement;
    },
    set activeElement(value) {
      this._activeElement = value;
    },
    querySelector: (selector) => (selector === '.menu-toggle' ? toggle : null),
    querySelectorAll: (selector) => {
      if (selector === 'nav') return [navElement];
      if (selector === 'a.button[href^="#"]') return [];
      if (selector === '.reveal') return [];
      return [];
    },
    getElementById: (id) => (id === 'mobileNav' ? menu : null),
    addEventListener: (type, fn) => { if (type === 'keydown') keydownHandler = fn; }
  };

  global.window = {
    matchMedia: () => ({ matches: false })
  };

  initialiseSite();

  return {
    toggle,
    menu,
    closeButton,
    navLink,
    exitLink,
    openMenu: () => { toggleClick(); },
    closeMenu: () => { toggleClick(); },
    clickCloseButton: () => { menuClick({ target: closeButton, preventDefault() {} }); },
    clickNavLink: () => { menuClick({ target: navLink, preventDefault() {} }); },
    clickOutsidePanel: () => { menuClick({ target: { closest: (selector) => (selector === '.mobile-drawer__panel' ? null : null) }, preventDefault() {} }); },
    clickExitLink: () => { menuClick({ target: exitLink, preventDefault() {} }); },
    pressEscape: () => { keydownHandler && keydownHandler({ key: 'Escape', preventDefault() {} }); },
    pressTab: (shiftKey = false) => { keydownHandler && keydownHandler({ key: 'Tab', shiftKey, preventDefault() {} }); }
  };
}

let documentStub;

test('button toggles menu visibility and manages focus', () => {
  const env = setup();
  env.openMenu();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(env.menu.classList.contains('open'), true);
  assert.equal(env.menu.hasAttribute('hidden'), false);
  assert.equal(documentStub.body.style.overflow, 'hidden');
  assert.equal(documentStub.activeElement, env.navLink);

  env.closeMenu();
  assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal(env.menu.hasAttribute('hidden'), true);
  assert.equal(documentStub.body.style.overflow, '');
  assert.equal(documentStub.activeElement, env.toggle);
});

test('clicking a nav link closes the menu without changing focus', () => {
  const env = setup();
  env.openMenu();
  env.clickNavLink();
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal(env.menu.hasAttribute('hidden'), true);
  assert.equal(documentStub.body.style.overflow, '');
  assert.equal(documentStub.activeElement, env.navLink);
});

test('close button and escape key close the menu and restore focus', () => {
  const env = setup();
  env.openMenu();
  env.clickCloseButton();
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal(documentStub.activeElement, env.toggle);

  env.openMenu();
  env.pressEscape();
  assert.equal(env.menu.classList.contains('open'), false);
  assert.equal(documentStub.activeElement, env.toggle);
});

