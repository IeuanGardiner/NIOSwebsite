const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Load the navigation handler from the modular script
const { go } = require(path.join('..', 'scripts', 'main.js'));

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
  const result = env.triggerClick(go);
  assert.deepStrictEqual(result, { top: 392, behavior: 'smooth' });
});

test('go works when CSS.escape is missing', { concurrency: 1 }, () => {
  global.CSS = undefined;
  const env = setupEnvironment();
  const result = env.triggerClick(go);
  assert.equal(result.top, 392);
});

