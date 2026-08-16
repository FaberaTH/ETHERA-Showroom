# Stacking Contexts & Potential Layout Issues — Diagnostic

This file summarizes the places in the codebase that may create stacking contexts
or otherwise affect positioning of elements that use position:fixed. These are
common causes for the bug: "fixed elements appearing behind other layers".

Findings (grep search for transform/will-change/filter occurrences):

- src/styles.css (multiple places):
  - .ui-overlay uses transform: translateY(...)
  - .brand, .tagline, .cta, .brand-frame::after, .brand-tile and others apply transform and animations
  - transforms are applied to tiles and to overlay elements; however these are mostly inside the Hero/Brand areas.

Why this matters
- Any ancestor that has a transform (other than 'none'), filter, opacity < 1, or will-change that promotes a stacking context
  will create a new containing block for position:fixed descendants. That means a fixed element rendered inside that
  ancestor will be fixed relative to it, not the viewport. This can lead to unexpected layering when you expect a fixed
  element to appear above everything.

Recommendations
1. Keep top-level panels that rely on position:fixed outside of transformed ancestors. The safest approach is to render
   modal/panel-like UI directly under <body> (React portal) so they're not constrained by local stacking contexts.
2. Avoid using transform on high-level containers that will contain fixed elements. Prefer transforms on leaf UI elements
   (tiles, decorative elements) instead of layout roots.
3. Use CSS custom properties for dynamic positioning (--brands-top, --showroom-top) and toggle classes for visibility.

What I changed already
- Added .showroom-panel which can be anchored via --showroom-top and given a .showroom-open class.
- Showroom now takes focus and shows/hides using classes rather than many inline styles.
- ShowroomRow's IntersectionObserver now uses the correct scroll parent so images load while the showroom is scrolled.

Next steps (optional to automate)
- Convert Hero and BrandSelection hover transforms to only affect child elements (already the case) and ensure no
  transform is applied to body/page-root elements.
- Add a small test page that dynamically toggles transforms on ancestors to reproduce stacking issues, then verify
  showroom-panel remains above (or move showroom into a portal attached to document.body).

If you'd like, I can refactor Showroom to render via React portal into document.body to guarantee it is outside any
stacking context. I can also run an automated pass to remove transform from any element that is an ancestor of a fixed
panel; this is riskier but possible.
