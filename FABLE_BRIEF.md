# VESTA — Marketing Website Brief

**Paste this whole document to Claude Fable as the prompt. It is the product owner's steer. The repo you are working in is the website repo itself.**

---

## Your role

You are the design-and-build lead for the marketing website of **Vesta**, a B2B SaaS product. I am the senior product owner; this brief is my steer on what the product is, who it's for, and how the site must look, feel, and behave. Where I've left something open, use your judgement — but do not violate the hard constraints at the end.

## What Vesta is

Vesta is a **portfolio risk and change management platform** for PMOs (project/programme management offices).

**The one-line story: a single source of truth for risk and change across your entire portfolio.**

What it replaces — and this is the pain every headline should hit — is the status quo of governance-by-spreadsheet: a dozen RAID spreadsheets in SharePoint, change requests approved over email, and steering-committee packs that are stale the moment they're exported. No live picture, no audit trail, no accountability.

The competitive wedge: **more rigour than Excel, a fraction of the weight of enterprise PPM.** The heavyweight suites (Planview, ServiceNow SPM) take months and consultants to deploy. Vesta is focused: risks, issues, changes, projects, programmes, reports — live, permissioned, and audit-ready.

What the product actually does (all real, all visible in the screenshots):

- **Home Control Centre** — whole-portfolio control posture at a glance: critical/high risks, overdue mitigations, urgent issues, overdue reviews, portfolio health RAG per programme and project, and a prioritised "act now" queue.
- **Risk registers and dashboard** — project and programme risk registers with scoring (5×5 likelihood × impact matrix, current vs target), owners, review cadence, mitigation actions, exposure in £, CSV/Excel export.
- **Controlled change** — change requests with a governed workflow (Draft → Submitted → Under Review → Decision → Implemented), approval-impact warnings (budget overrun, schedule slip, open risks), and permanent, auditable approval decisions.
- **Issues** — escalation and tracking alongside risks and changes.
- **Projects & programmes** — a project register with contract value, dates, health, and rollup into client-defined programme groupings.
- **Reports** — risk exposure by category and level, change pipeline with net cost/schedule impact, everything exportable.
- **Enterprise foundations** — Microsoft Entra ID single sign-on, role-based access control, full audit trail, Azure-hosted, CSV/Excel import and export.

## Who it's for

- **Primary buyer: the PMO Director / Head of Portfolio** at a large organisation. They own governance, report to boards, and carry the risk exposure. The site must make *them* trust it.
- **Champion: the day-to-day programme/project manager** who is tired of reconciling spreadsheets. The site should make them think "this would make my life easier."
- **Deliberately flexible downward:** individuals and small businesses can use it too. Tiering will reflect that. Don't let enterprise framing make it feel unreachable — the story is "enterprise-grade governance that doesn't need an enterprise to run it."

## What you're starting from

This repo is currently a repurposed consultancy site (static HTML, `partials/` loaded via `data-include`, `styles/tokens.css` design tokens, light/dark theme toggle, vanilla JS). **All existing copy and positioning is obsolete — replace it.** The old product story ("professionalise everyday work") and every mention of the old company is gone.

Keep the good bones: the static architecture, the partials pattern, the token-based theming with light/dark support, the accessibility basics (skip link, aria labelling, `reveal` scroll animations).

## Brand

- The product and site brand is **VESTA. Nothing else.** Do not mention NIOS, NIOS Cloud Solutions, or AberTech anywhere. Retire the old logo images (`images/abertech*.png`) from all markup.
- No logo exists. **Create a clean typographic wordmark** — "Vesta" set confidently (Plus Jakarta Sans or similar geometric grotesque), optionally with a simple geometric glyph. Premium, restrained, credible. Generate a matching favicon.
- Name is provisional, so keep the wordmark purely typographic — cheap to re-cut if the name changes.

## Look & feel — the steer

Target calibre: **Linear / Stripe.** The identity is already right — slate-900 base, indigo accent, Inter body + Plus Jakarta Sans display — execute it at a much higher level of craft.

- **Dark, confident hero** with a real product screenshot front and centre (see screenshot list). Light sections alternating with dark for rhythm.
- **Motion as seasoning, never the meal.** Inspired by modern awwwards SaaS sites: a subtle animated hero backdrop (slow gradient drift, faint grid/particle texture — CSS or lightweight canvas), scroll-triggered reveals, gentle depth/perspective on screenshots (slight tilt that settles on scroll), smooth micro-interactions on cards and buttons. **Nothing overbearing**: no heavy WebGL scenes, no autoplaying video files, no scroll-jacking.
- **Performance is a trust signal.** A PMO Director on office Wi-Fi who waits 3 seconds bounces. Keep total page weight lean, lazy-load below-fold screenshots, respect `prefers-reduced-motion` (all motion collapses to static), 60fps only.
- The old aesthetic sin to avoid: the corporate-brochure look of legacy PPM vendors. Vesta should look like the modern alternative, because it is.
- Screenshots are dark-mode captures — present them in slim browser-chrome frames with subtle shadow/glow so they sit beautifully on both dark and light sections.

## Screenshots (already in the repo — design around them)

All in `images/screenshots/`, 3200×2000 PNG (2× density), dark mode, realistic demo data:

| File | What it shows | Use it for |
|---|---|---|
| `app-home-control-centre.png` | Portfolio control centre: posture banner, KPI tiles, portfolio health RAG, priority action queue | **Hero.** This is the "single source of truth" money shot |
| `app-risk-dashboard.png` | Risk dashboard: KPI tiles, 5×5 risk matrix, top priority risks, attention-needed list | Risk feature section — the matrix is instantly recognisable to the audience |
| `app-risk-register.png` | Data-dense risk register: scoring, owners, review dates, statuses, filters | "Replace your spreadsheet" section — this is the register they currently keep in Excel |
| `app-change-detail.png` | Change request C001: workflow stepper, approval-impact warnings, permanent approval decision | Controlled-change section — governance and auditability story |
| `app-projects-register.png` | Project register: contract values, programmes, PMs, health RAG | Portfolio/projects section |
| `app-reports.png` | Reports: risk exposure by category/level, change pipeline with £ impact, CSV export | Reporting section — "your board pack, generated not assembled" |

Videos will replace/augment some of these later — structure image containers so a `<video>` can slot in without layout change.

## Site structure — multi-page

Keep the header/footer partials shared across pages. Build:

1. **Home (`index.html`)** — the story arc: hero (headline + control-centre shot + CTA) → the pain (spreadsheet chaos vs single source of truth) → three-to-four feature moments with screenshots → security & trust strip → social-proof placeholder → early-access CTA.
2. **Product (`product.html`)** — the screen-by-screen walkthrough: each capability section anchored by its screenshot (risk, change, projects, reports). Deep enough that a PM can imagine their Tuesday in it.
3. **Pricing (`pricing.html`)** — **directional only, no numbers.** Three tiers as a shape: *Individual / Team / Enterprise* (you may rename). Each with an honest feature sketch. Every tier's CTA is "Register interest". A clear line that pricing is being finalised with founding customers and a **free trial is coming**.
4. **Contact (`contact.html`)** — the register-interest / book-a-demo page.

Nav: Product · Pricing · Contact, plus a persistent "Register interest" button.

## Conversion & honesty rules (hard constraints)

- **Primary CTA everywhere: "Register interest" / "Book a demo".** No "Start free trial" buttons — the trial doesn't exist yet. Signpost it as coming.
- **The demo-request form must look production-grade but be wired to a swappable stub**: form `action` clearly marked `TODO` in a comment, with a `mailto:` fallback. Do not sign us up to any third-party form service.
- **Contact details are placeholders** (no domain/email exists yet) — mark them clearly in comments for later swap.
- **Zero fabrication.** No invented testimonials, client names, logos, star ratings, usage stats, or "trusted by" claims. Build the testimonials/logos section — styled, structural, ready — but populate with *clearly-labelled placeholder content* so real quotes are a copy swap later.
- Credibility comes from what's true: the product screenshots, a **Security & Trust** section (Entra ID SSO, role-based access, full audit trail, Azure-hosted, import/export), and **founding-cohort framing** — early access, shape the roadmap, priority onboarding.
- UK English throughout (`lang="en-GB"`, "programme", "organisation").

## Technical constraints

- Static HTML/CSS/vanilla JS only. No build step, no framework, no new runtime dependencies. Google Fonts + self-contained assets are fine.
- Keep and extend the `data-include` partials loader, `styles/tokens.css` tokens, and the light/dark theme toggle (site must be excellent in both themes).
- Semantic, accessible HTML: heading order, landmarks, focus states, contrast AA+, skip link stays.
- Responsive from 360px to ultrawide. The hero screenshot treatment must degrade gracefully on mobile.
- Real `<title>`/meta description per page; Open Graph tags using the hero screenshot.

## Out of scope — do not build

- Actual pricing figures, billing, or signup/trial flows
- Video production (leave slots)
- Any backend or form service integration
- Blog/docs/careers pages
- Renaming the product or inventing company facts

## Definition of done

A stranger landing on this site should conclude within 10 seconds: *this is a real, credible SaaS product that gives a PMO one live source of truth for risk and change — and I can register interest right now.* Every page excellent in dark and light mode, fast, accessible, and honest.
