# Vesta — Design System

Static HTML/CSS/vanilla JS. Tokens in `styles/tokens.css`, all component styles in `styles/main.css`. Light/dark via `html[data-theme]`, set pre-paint in each page `<head>`.

## Theme model

Two layers of colour tokens:

- **Theme tokens** (`--bg`, `--ink`, `--ink-secondary`, `--ink-muted`, `--surface`, `--border`, `--link`) flip with `data-theme`. Used by body sections.
- **Night tokens** (`--night-*`) are invariant. Every page opens with a dark band (`.band--night`), and reports/trust/CTA strips stay dark in both themes. This gives the "dark, confident hero + light/dark rhythm" in light mode, and tonal variation in dark mode.

## Palette

- Base ink: `#0e1526` (slate-900 with a slight indigo tint). Night background: `#070b17`, raised `#0c1224` (matches the app screenshots at ~`#0a0e1c`).
- Accent: indigo. `#4f46e5` for fills/links on light, `#97a0ff` for text accents on night surfaces. One accent, used identically everywhere.
- RAG colours appear only inside product screenshots; the marketing chrome never borrows them.

## Typography

- Display: **Plus Jakarta Sans** 600/700/800, letter-spacing -0.02em, `text-wrap: balance` on h1–h3.
- Body: **Inter** 400/500/600, line-height 1.6–1.7, measure capped at 62ch.
- Scale: fluid `clamp()` on display sizes; h1 ≈ clamp(2.6rem → 4.2rem).

## Components

- **Wordmark:** typographic "Vesta" in Plus Jakarta Sans 700 + geometric glyph (rounded-square indigo tile, white V chevron). Same glyph is the favicon (`images/favicon.svg`). Purely typographic by design, cheap to re-cut.
- **`.frame`:** slim browser-chrome frame for app screenshots (invariant dark chrome bar, three window dots, hairline border, soft indigo ambient shadow). `.frame__media` is an `aspect-ratio: 16/10` container so a `<video>` can replace the `<img>` without layout change.
- **Buttons:** `.button` indigo fill, 10px radius, hover lift 1px, active press; `.button--ghost` hairline. Radius system: 10px interactive, 14–20px containers, consistent.
- **`.reveal`:** scroll reveal (translateY + fade), only active when `html.js`; instant under reduced motion.

## Motion

- Hero backdrop: two radial-gradient plates drifting slowly (transform-only keyframes) + faint grid/dot texture.
- Hero screenshot: slight `rotateX` perspective tilt that settles flat once scrolled into view (class toggle, 900ms `cubic-bezier(0.16,1,0.3,1)`).
- Everything gated by `@media (prefers-reduced-motion: reduce)` → static.

## Layout

- Container `--max-width: 1140px`; section padding `clamp(4.5rem, 9vw, 7.5rem)`.
- Section layout families are deliberately varied: split feature rows (max two consecutive), ledger rows (pain → answer), full-width dark statement bands, tier cards (pricing only), form + aside (contact).
