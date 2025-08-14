const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract the navigation function from index.html
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const start = html.indexOf('function go(e)');
  const end = html.indexOf('} document.querySelectorAll(\'nav\'', start) + 1;
if (start === -1 || end === -1) {
  throw new Error('go function not found in index.html');
}
const goSrc = `const d=document, h=document.querySelector('.site-header'); ${html.slice(start, end)}`;


function setupEnvironment() {
  let scrollArgs;
  const header = { offsetHeight: 100 };
  const target = { getBoundingClientRect: () => ({ top: 500 }) };

  const documentStub = {
    querySelector: (selector) => {
      if (selector === '.site-header') return header;
      return null;
    },
    getElementById: (id) => (id === 'target' ? target : null),
    querySelectorAll: () => []
  };

  const windowStub = {
    scrollY: 0,
    matchMedia: () => ({ matches: false }),
    scrollTo: (opts) => { scrollArgs = opts; }
  };

  global.document = documentStub;
  global.window = windowStub;

  return {
    triggerClick(goFn) {
      const anchor = { getAttribute: () => '#target' };
      const event = {
        target: { closest: () => anchor },
        preventDefault: () => {}
      };
      goFn(event);
      return scrollArgs;
    }
  };
}

test('go calls scrollTo with header offset', { concurrency: 1 }, () => {
  global.CSS = { escape: (s) => s };
  const env = setupEnvironment();
  const goFn = eval(`${goSrc}; go`);
  const result = env.triggerClick(goFn);
  assert.deepStrictEqual(result, { top: 392, behavior: 'smooth' });
});

test('go works when CSS.escape is missing', { concurrency: 1 }, () => {
  global.CSS = undefined;
  const env = setupEnvironment();
  const goFn = eval(`${goSrc}; go`);
  const result = env.triggerClick(goFn);
  assert.equal(result.top, 392);
});

