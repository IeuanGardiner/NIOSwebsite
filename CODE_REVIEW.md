# Website Code Review (2026-04-06)

## Scope
- `index.html`
- `partials/*.html`
- `scripts/main.js`
- `styles/*.css`
- `tests/*.js`

## Findings

### 1) Placeholder content across SEO-critical and user-visible fields (High)
Several key fields still use bracketed placeholders, including document title, meta description, skip link text, and primary section/body content. This will hurt search ranking, trust, and conversion if deployed as-is.

- Examples:
  - `index.html` title/description/skip link/noscript placeholders.
  - all section partials and nav labels use placeholders.

**Recommendation:** Replace all bracket placeholders with real brand copy before any public release.

### 2) Automated tests are out of sync with current navigation implementation (High)
`tests/mobile-nav.test.js` expects the menu `hidden` attribute to be removed/added during open/close, but `setupMobileMenu()` controls state via classes/aria/body overflow and never toggles `hidden`. This currently causes test failure.

**Recommendation:** Align test expectations with implementation OR restore `hidden` attribute behavior in JS/CSS and keep tests as guardrails.

### 3) Core content is JS-dependent due runtime partial fetches (Medium)
Main content is loaded via client-side `fetch` from `partials/*.html`. If JS fails (or CSP/network/policy blocks local fetches), content does not render and users only receive a generic fallback/`noscript` message.

**Recommendation:** Prefer build-time includes/SSR/static generation so primary content exists in initial HTML.

### 4) Contact form has no submission backend integration (Medium)
Form is configured with `action="#"` and submit handler only shows a success message + resets form; no actual delivery/storage occurs.

**Recommendation:** Integrate a backend endpoint or transactional form service and add success/error handling states.

### 5) Broken legal navigation anchors (Medium)
Footer links target `#privacy` and `#terms`, but no sections/pages exist with those IDs.

**Recommendation:** Point these links to real legal pages or add sections with matching IDs.

### 6) Performance risk from unthrottled pointer tracking on every card (Low)
`setupCardGlow()` binds `mousemove` listeners to all `.card` elements and writes CSS variables each event.

**Recommendation:** Throttle with `requestAnimationFrame`, gate to hover-capable pointers, and disable on lower-power contexts.

### 7) Accessibility copy quality issue in skip/noscript text (Low)
Important accessibility elements currently use placeholders (`[Skip to content]`, `[JavaScript required message]`).

**Recommendation:** Replace with concise, user-friendly real language.

## Validation performed
- Ran `npm test` (currently failing one mobile nav test due mismatch noted above).
- Reviewed markup, CSS, JS, and tests for accessibility, SEO, performance, maintainability, and behavioral consistency.
