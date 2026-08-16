import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { CarItem } from '../data/carIndex'

type Props = {
  align?: 'left' | 'right'
  car: CarItem
  initialVisible?: boolean
  brandId?: string
}

type SpecItem = { icon: 'speed' | 'power' | 'top'; label: string }
type MetaInfo = { headline: string; desc: string; specs: SpecItem[] }

export default function ShowroomRow({ align = 'left', car, initialVisible = false, brandId }: Props) {
  const root = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [visible, setVisible] = useState<boolean>(initialVisible)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el) return
    // debug mount
    try { console.debug('ShowroomRow mount', { id: car.id, initialVisible }) } catch (e) {}
    // entrance animation for the row
    gsap.fromTo(el, { autoAlpha: 0, x: align === 'left' ? -40 : 40 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'power2.out' })
  }, [align])

  useEffect(() => {
    const target = imgRef.current ?? root.current
    if (!target) return

    // find the nearest scrollable ancestor so we can observe visibility relative to
    // the actual scrolling container (important because showroom uses overflow:auto)
    function findScrollParent(el: HTMLElement | null): HTMLElement | null {
      let p = el?.parentElement
      while (p) {
        const style = window.getComputedStyle(p)
        const overflowY = style.overflowY
        const isScrollable = /(auto|scroll)/.test(overflowY || '') && p.scrollHeight > p.clientHeight
        if (isScrollable) return p
        p = p.parentElement
      }
      return null
    }

    // prefer the showroom portal as the observer root if present (portal is full-screen scrollable)
    const portalEl = typeof document !== 'undefined' ? document.getElementById('showroom-portal-root') : null
    const rootForObserver = portalEl ?? findScrollParent(root.current) // may be the showroom container

    let obs: IntersectionObserver | null = null
    obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // debug: log intersection events for rows
        try {
          console.debug('IntersectionObserver:', { id: car.id, isIntersecting: entry.isIntersecting, ratio: entry.intersectionRatio })
        } catch (e) {}
        if (entry.isIntersecting) {
          // debug
          try { console.debug('ShowroomRow visible triggered', car.id) } catch (e) {}
          setVisible(true)
          if (obs) {
            obs.disconnect()
            obs = null
          }
        }
      })
    }, { root: rootForObserver, rootMargin: '200px', threshold: 0.02 })

    obs.observe(target)

    return () => { if (obs) obs.disconnect() }
  }, [])

  // small inline icon renderer (SVG strings)
  function iconSvg(name: string) {
    switch (name) {
      case 'speed':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12a9 9 0 1 0 18 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      case 'power':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12h14l-7 10L5 12z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      case 'top':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h3l3-8 4 16 3-8h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      default:
        return ''
    }
  }

  // If the img is already in cache and complete, mark as loaded so opacity shows immediately.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete) {
      setLoaded(true)
      try { console.debug('ShowroomRow img already complete', car.id) } catch (e) {}
    }
  }, [visible])

  useEffect(() => {
    try { console.debug('ShowroomRow state', { id: car.id, visible, loaded }) } catch (e) {}
  }, [visible, loaded])

  const brandNames: Record<string, string> = {
    aston: 'Aston Martin',
    bmw: 'BMW',
    ferrari: 'Ferrari',
    mclaren: 'McLaren',
    porsche: 'Porsche',
  }

  const brandMeta: Record<string, Record<string, MetaInfo>> = {
    aston: {
      'vantage': {
        headline: 'Driver-focused Grand Tourer',
        desc: 'Balanced handling. Handbuilt V8.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.6s' },
          { icon: 'power', label: '503 hp' },
          { icon: 'top', label: 'Top Speed | 307 km/h' },
        ],
      },
      'dbs superleggera': {
        headline: 'Ultimate Power & Elegance',
        desc: 'V12 force, carbon-fibre body.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.4s' },
          { icon: 'power', label: '715 hp' },
          { icon: 'top', label: 'Top Speed | 340 km/h' },
        ],
      },
      'valkyre': {
        headline: 'Hypercar Precision',
        desc: 'Track-born aerodynamics and extreme output.',
        specs: [
          { icon: 'speed', label: '0-100 • 2.5s' },
          { icon: 'power', label: '1160 hp' },
          { icon: 'top', label: 'Top Speed | 402 km/h' },
        ],
      },
    },
    bmw: {
      'm8': {
        headline: 'Luxury Muscle Performance',
        desc: 'Twin-turbo V8, sharp chassis and long-distance comfort.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.3s' },
          { icon: 'power', label: '617 hp' },
          { icon: 'top', label: 'Top Speed | 305 km/h' },
        ],
      },
      'm4': {
        headline: 'Precision Coupe Dynamics',
        desc: 'Track-capable balance with everyday usability.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.9s' },
          { icon: 'power', label: '503 hp' },
          { icon: 'top', label: 'Top Speed | 290 km/h' },
        ],
      },
      'i8': {
        headline: 'Hybrid Future Icon',
        desc: 'Lightweight carbon architecture with electric punch.',
        specs: [
          { icon: 'speed', label: '0-100 • 4.4s' },
          { icon: 'power', label: '369 hp' },
          { icon: 'top', label: 'Top Speed | 250 km/h' },
        ],
      },
    },
    ferrari: {
      'sf90 stradale': {
        headline: 'Electrified Maranello Force',
        desc: 'Hybrid hyper-performance and extreme traction.',
        specs: [
          { icon: 'speed', label: '0-100 • 2.5s' },
          { icon: 'power', label: '986 hp' },
          { icon: 'top', label: 'Top Speed | 340 km/h' },
        ],
      },
      'roma': {
        headline: 'Modern Italian Grand Tourer',
        desc: 'Elegant lines, responsive V8 and refined control.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.4s' },
          { icon: 'power', label: '612 hp' },
          { icon: 'top', label: 'Top Speed | 320 km/h' },
        ],
      },
      'laferrari': {
        headline: 'Flagship Hybrid Legacy',
        desc: 'Race-derived hybrid system with iconic presence.',
        specs: [
          { icon: 'speed', label: '0-100 • 2.8s' },
          { icon: 'power', label: '949 hp' },
          { icon: 'top', label: 'Top Speed | 350 km/h' },
        ],
      },
    },
    mclaren: {
      'senna': {
        headline: 'Track Weapon Precision',
        desc: 'Aerodynamic downforce and razor-sharp response.',
        specs: [
          { icon: 'speed', label: '0-100 • 2.8s' },
          { icon: 'power', label: '789 hp' },
          { icon: 'top', label: 'Top Speed | 335 km/h' },
        ],
      },
      'p1': {
        headline: 'Hybrid Hypercar Statement',
        desc: 'Instant torque delivery with race-bred DNA.',
        specs: [
          { icon: 'speed', label: '0-100 • 2.8s' },
          { icon: 'power', label: '903 hp' },
          { icon: 'top', label: 'Top Speed | 350 km/h' },
        ],
      },
      '720s': {
        headline: 'Superlight Power Balance',
        desc: 'Carbon monocage precision and explosive acceleration.',
        specs: [
          { icon: 'speed', label: '0-100 • 2.9s' },
          { icon: 'power', label: '710 hp' },
          { icon: 'top', label: 'Top Speed | 341 km/h' },
        ],
      },
    },
    porsche: {
      'taycan turbo': {
        headline: 'Electric Performance Control',
        desc: 'Instant thrust with all-wheel precision dynamics.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.2s' },
          { icon: 'power', label: '872 hp' },
          { icon: 'top', label: 'Top Speed | 260 km/h' },
        ],
      },
      'spyder': {
        headline: 'Open-air Motorsport Character',
        desc: 'Naturally aspirated precision and lightweight control.',
        specs: [
          { icon: 'speed', label: '0-100 • 4.0s' },
          { icon: 'power', label: '495 hp' },
          { icon: 'top', label: 'Top Speed | 308 km/h' },
        ],
      },
      '911 gt3 rs': {
        headline: 'Road-legal Circuit Focus',
        desc: 'Aero-intensive setup with relentless grip.',
        specs: [
          { icon: 'speed', label: '0-100 • 3.2s' },
          { icon: 'power', label: '518 hp' },
          { icon: 'top', label: 'Top Speed | 296 km/h' },
        ],
      },
    },
  }

  const key = car.title.toLowerCase()
  const info = (brandId && brandMeta[brandId]?.[key]) || {
    headline: 'Editorial highlights',
    desc: 'Exquisite design and performance. Precision engineering and sculpted dynamics.',
    specs: [
      { icon: 'speed', label: '0-100 • --' },
      { icon: 'power', label: '-- hp' },
      { icon: 'top', label: 'Top Speed | -- km/h' },
    ] as SpecItem[],
  }

  const kicker = (brandId && brandNames[brandId]) || 'Performance Collection'

  return (
    <div id={car.id} className={`showroom-row ${align}`} ref={root} role="group" aria-label={car.title} tabIndex={0}>
      <figure className="showroom-media" aria-hidden={loaded ? 'false' : 'true'}>
        <img
          ref={imgRef}
          src={car.src}
          alt={car.title}
          loading={initialVisible ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(true)
            console.warn('Failed to load showroom image', car.src)
            if (imgRef.current) imgRef.current.setAttribute('data-error', 'true')
          }}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 420ms ease-in' }}
        />
        <div className="placeholder" aria-hidden style={{ display: loaded ? 'none' : 'flex' }}>{car.title}</div>
      </figure>

      <div className="showroom-meta">
        <div className="meta-kicker">{kicker}</div>
        <h3 className="meta-title">{car.title}</h3>
        <p className="meta-headline">{info.headline}</p>
        <p className="meta-desc">{info.desc} · Rear-wheel dynamics · Hand-finished details.</p>
        <div className="specs">
          {info.specs.map((s, i) => (
            <div className={`spec-item${s.icon === 'top' ? ' spec-item-top' : ''}`} key={i}>
              <span className="spec-icon" aria-hidden dangerouslySetInnerHTML={{ __html: iconSvg(s.icon) }} />
              <span className="spec-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
