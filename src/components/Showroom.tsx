import React from 'react'
import { createPortal } from 'react-dom'
import ShowroomRow from './ShowroomRow'
import { CarItem } from '../data/carIndex'

type Props = {
  brandId: string
  brandName?: string
  brandLogo?: string
  carList: CarItem[]
  query?: string
  onBack?: () => void
}

export default function Showroom({ brandId, brandName, brandLogo, carList, query = '', onBack }: Props) {
  const q = query.trim().toLowerCase()
  const filtered = q ? carList.filter(c => c.title.toLowerCase().includes(q)) : carList

  // preload first few images to ensure a visible result on open (helps Firefox cases)
  React.useEffect(() => {
    if (!filtered || filtered.length === 0) return
    const toPreload = filtered.slice(0, 3)
    const imgs: HTMLImageElement[] = []
    toPreload.forEach((c) => {
      if (c.src) {
        const i = new Image()
        i.src = c.src
        imgs.push(i)
        // also probe the resource to detect 404s early (useful for debugging)
        fetch(c.src, { method: 'GET' }).then((res) => {
          if (!res.ok) {
            // eslint-disable-next-line no-console
            console.warn('Showroom preload: resource not ok', c.src, res.status)
          }
        }).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('Showroom preload: fetch failed', c.src, err)
        })
      }
    })
    // additionally preload remaining images (non-blocking) to ensure they show when scrolled
    const remaining = filtered.slice(3)
    const remImgs: HTMLImageElement[] = []
    const remTimer = setTimeout(() => {
      remaining.forEach((c) => {
        if (c.src) {
          const i = new Image()
          i.src = c.src
          remImgs.push(i)
        }
      })
    }, 250)
    return () => {
      // allow GC
      clearTimeout(remTimer)
    }
  }, [brandId])

  React.useEffect(() => {
    // debug: log the resolved src paths for the showroom so we can inspect requests
    // in the browser console during development.
    if (filtered && filtered.length > 0) {
      // eslint-disable-next-line no-console
      console.debug('Showroom will render sources:', filtered.map(f => f.src))
    }
  }, [filtered])

  const content = (
    <section className="showroom-root" aria-label={`Showroom for ${brandId}`} tabIndex={-1}>
      <div className="showroom-header">
        <h2 className="showroom-brand-title">
          {brandLogo ? <img className={`showroom-brand-logo showroom-brand-logo-${brandId}`} src={brandLogo} alt="" aria-hidden="true" /> : null}
          <span>{brandName ? brandName.toUpperCase() : (brandId ? brandId.toUpperCase() : 'SHOWROOM')}</span>
        </h2>
        <div>
          <button
            className="btn-back"
            onClick={() => onBack && onBack()}
            data-showroom-focus
            aria-label="Back to Brands"
            style={{ minWidth: 140, padding: '8px 14px', fontSize: 14 }}
          >
            <span className="label">VOLTAR</span>
            <svg className="btn-stroke" viewBox="0 0 160 36" preserveAspectRatio="none" aria-hidden>
              <rect x="0.5" y="0.5" width="159" height="35" rx="8" ry="8" fill="none" />
            </svg>
          </button>
        </div>
      </div>

      <div className="showroom-inner">
        {filtered.map((c, i) => (
          <ShowroomRow key={c.id} brandId={brandId} align={c.align} car={c} initialVisible={i < 2} />
        ))}
      </div>
    </section>
  )

  // render showroom in a portal at document.body to avoid stacking-context issues
  if (typeof document !== 'undefined') {
    let root = document.getElementById('showroom-portal-root')
    if (!root) {
      root = document.createElement('div')
      root.id = 'showroom-portal-root'
      document.body.appendChild(root)
    }
    // set body attribute so other UI can adapt to the active brand (logo positioning etc.)
    try {
      if (brandId) document.body.setAttribute('data-active-brand', brandId)
    } catch (e) {}
    // cleanup when unmounting handled by component that removes class on close (collection-logic)
    return createPortal(content, root)
  }

  return content
}
