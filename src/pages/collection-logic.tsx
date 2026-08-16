import gsap from 'gsap'

/**
 * Small utility module that exposes simple GSAP timelines to orchestrate
 * vertical transitions between the Hero, BrandSelection and Showroom areas.
 *
 * Usage (scaffold):
 *  const t = goToBrands({ heroEl, brandsEl })
 *  // later: goToShowroom({ brandsEl, showroomEl })
 *
 * The functions accept elements (or selectors) and return the created timeline
 * so the caller can store / kill it as needed.
 */

type El = HTMLElement | null

export function goToBrands({ heroEl, brandsEl }: { heroEl: El; brandsEl: El }) {
  if (!heroEl || !brandsEl) return null
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

  // disable interactions while animating
  if (heroEl instanceof HTMLElement) heroEl.style.pointerEvents = 'none'
  if (brandsEl instanceof HTMLElement) brandsEl.style.pointerEvents = 'none'

  // slide hero partially up (just enough to present brands) and reveal brands underneath
  const slideAmount = -48 // percent; partial slide so hero remains as backdrop
  tl.to(heroEl, { yPercent: slideAmount, duration: 1.1 })

  // after hero slide completes, expose brands container and animate tiles sequentially
  tl.call(() => {
    if (brandsEl instanceof HTMLElement) {
      // prefer to align the top of the brands panel to the bottom of the still image
      // so the three horizontal bands (still / brands / search) align visually.
      const still = document.getElementById('hero-still') as HTMLElement | null
      let topPx = null
      if (still) {
        const r = still.getBoundingClientRect()
        // leave a small gap (24px) between still bottom and brands top
        topPx = Math.max(12, Math.round(r.bottom + 24))
      }

      // prefer CSS-driven state; set --brands-top custom property for responsive positioning
      if (topPx !== null) {
        brandsEl.style.setProperty('--brands-top', `${topPx}px`)
      } else {
        const remaining = 100 + slideAmount
        brandsEl.style.setProperty('--brands-top', `${remaining}vh`)
      }

      // ensure any inline 'display: none' (set at mount) is cleared so CSS class can take effect
      brandsEl.style.display = ''
      // add a class that makes the brands panel visible and interactive
      brandsEl.classList.add('brands-open')
      // temporarily keep interactions disabled until the reveal animation completes
      brandsEl.style.pointerEvents = 'none'
    }
  })

  // prepare tiles and animate them after a short pause so they appear one-by-one
  const tiles = (brandsEl instanceof HTMLElement) ? Array.from(brandsEl.querySelectorAll('.brand-tile')) : []
  if (tiles.length > 0) {
    // set initial state
    gsap.set(tiles, { autoAlpha: 0, y: 18, scale: 0.985 })
    tl.to({}, { duration: 0.08 })
    tl.to(tiles, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' })
  } else {
    tl.to(brandsEl, { autoAlpha: 1, y: 0, duration: 0.9 })
  }

  // restore interactions on brands and disable hero pointer events
  tl.call(() => {
    if (brandsEl instanceof HTMLElement) {
      brandsEl.style.pointerEvents = 'auto'
    }
    if (heroEl instanceof HTMLElement) heroEl.style.pointerEvents = 'none'
  })

  return tl
}

export function goToShowroom({ brandsEl, showroomEl, brandId }: { brandsEl: El; showroomEl: El; brandId?: string }) {
  if (!brandsEl || !showroomEl) return null
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
  // ensure showroom is visible in layout
  if (showroomEl instanceof HTMLElement) {
    // We render the showroom via a portal. Instead of anchoring the portal by top,
    // we keep the portal full-screen and add padding-top equal to the visible gap
    // below the moved brands panel so the showroom content appears as a distinct
    // session below the brands.
    try {
      const br = (brandsEl as HTMLElement).getBoundingClientRect()
      const portal = document.getElementById('showroom-portal-root')
      if (portal) {
        // compute pad so content begins below the lifted brands later (we subtract liftPx)
        const padTop = Math.max(0, Math.round(br.bottom - liftPx))
        portal.style.paddingTop = `${padTop}px`
        portal.classList.add('showroom-open')
      }
      showroomEl.classList.add('showroom-open')
    } catch (e) {
      const portal = document.getElementById('showroom-portal-root')
      if (portal) portal.classList.add('showroom-open')
      showroomEl.classList.add('showroom-open')
    }
  }

  // animate brands to move up enough so the showroom (positioned below) becomes visible.
  // compute lift in pixels based on the brands panel height so it's responsive.
  const brRect = (brandsEl as HTMLElement).getBoundingClientRect()
  const liftPx = Math.round(brRect.height * 0.62) // reveal ~62% of brands height
  // faster, tighter lift to reduce perceived delay
  tl.to(brandsEl, { y: -liftPx, scale: 0.97, transformOrigin: 'center top', duration: 0.45, ease: 'power2.inOut' })

  // disable interactions on brands so scroll goes to showroom
  tl.call(() => { if (brandsEl instanceof HTMLElement) brandsEl.style.pointerEvents = 'none' })

  // accessibility: hide brands from assistive tech and mark showroom visible
  tl.call(() => {
    try {
      if (brandsEl instanceof HTMLElement) {
        // if focus is currently inside the brands panel, blur it before hiding to avoid
        // aria-hidden on a focused descendant (this triggers browser warnings and
        // can interfere with accessibility tools).
        try {
          const active = document.activeElement as HTMLElement | null
          if (active && brandsEl.contains(active)) {
            active.blur()
          }
        } catch (e) {}
        brandsEl.setAttribute('aria-hidden', 'true')
      }
      if (showroomEl instanceof HTMLElement) showroomEl.setAttribute('aria-hidden', 'false')
      // prefer class on body to control scroll state
      document.body.classList.add('no-scroll')
    } catch (e) {}
  })

  // reveal showroom by animating it into view (it already sits just below the moved brands)
  // run showroom and portal reveal quickly and overlapping with the lift for a snappier feel
  tl.fromTo(showroomEl, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45 }, '-=0.18')

  // also animate the portal root (if present) slightly overlapping
  tl.call(() => {
    try {
      const portal = document.getElementById('showroom-portal-root') as HTMLElement | null
      if (portal) {
        gsap.fromTo(portal, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' })
      }
    } catch (e) {}
  }, null, '-=0.24')

  // focus the showroom's first focusable element for keyboard users
  tl.call(() => {
    try {
      const focusEl = (showroomEl as HTMLElement)?.querySelector('[data-showroom-focus]') as HTMLElement | null
      const portal = document.getElementById('showroom-portal-root')
      if (portal) {
        // ensure portal scrolls to top so content is visible; some zoom levels can push
        // content off-screen otherwise
        try { portal.scrollTop = 0 } catch (e) {}
      }
      if (focusEl) {
        // scroll the focused element into view in case padding-top pushed it down
        try { focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch (e) {}
        focusEl.focus()
      } else if (showroomEl instanceof HTMLElement) showroomEl.focus()
    } catch (e) {}
  })

  return tl
}

export function backToBrands({ showroomEl, brandsEl }: { showroomEl: El; brandsEl: El }) {
  if (!showroomEl || !brandsEl) return null
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
  // hide showroom and restore brands to original position
  // Prefer animating the portal root if present (Showroom is portaled to body)
  const portal = typeof document !== 'undefined' ? document.getElementById('showroom-portal-root') : null
  if (portal) {
    tl.to(portal, { autoAlpha: 0, y: 18, duration: 0.45 })
  } else {
    tl.to(showroomEl, { autoAlpha: 0, y: 18, duration: 0.45 })
  }
  tl.to(brandsEl, { autoAlpha: 1, y: 0, duration: 0.45 }, '-=0.2')
  // after hiding showroom, restore brands interactions and hide/reset the showroom container
  tl.call(() => {
    if (brandsEl instanceof HTMLElement) {
      brandsEl.style.pointerEvents = 'auto'
      // reset any inline transform set by GSAP (in case of direct style)
      brandsEl.style.transform = ''
      brandsEl.classList.remove('brands-open')
    }
    if (showroomEl instanceof HTMLElement) {
      showroomEl.classList.remove('showroom-open')
      try {
        showroomEl.setAttribute('aria-hidden', 'true')
      } catch (e) {}
      // restore body scroll
      try { document.body.classList.remove('no-scroll') } catch (e) {}
    }
    const portal = document.getElementById('showroom-portal-root')
    if (portal) {
      portal.classList.remove('showroom-open')
      portal.style.removeProperty('padding-top')
    }
    try { document.body.removeAttribute('data-active-brand') } catch (e) {}
  })
  return tl
}
