import React, { useRef, useEffect, forwardRef } from 'react'
import gsap from 'gsap'

export type Brand = { id: string; name: string; logo?: string }

type Props = {
  brands: Brand[]
  onSelect: (brandId: string) => void
  children?: React.ReactNode
}

const BrandSelection = forwardRef<HTMLDivElement, Props>(function BrandSelection({ brands, onSelect, children }: Props, ref) {
  const gridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5 // -0.5..0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      const tiles = Array.from(el.querySelectorAll('.brand-tile')) as HTMLElement[]
      const center = (tiles.length - 1) / 2
      tiles.forEach((t, i) => {
        const depth = (i - center) / Math.max(1, center)
        const tx = nx * 16 * depth
        const ty = ny * 10 * Math.abs(depth)
        const ry = nx * -6 * depth
        gsap.to(t, { x: tx, y: ty, rotateY: ry, duration: 0.6, ease: 'power3.out' })
      })
    }

    const onLeave = () => {
      const tiles = Array.from(el.querySelectorAll('.brand-tile')) as HTMLElement[]
      tiles.forEach((t) => gsap.to(t, { x: 0, y: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' }))
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section ref={ref as any} className="brands-root" aria-label="Brand selection">
      <div ref={gridRef} className="brands-grid" role="list">
        {brands.map((b) => (
          <button
            key={b.id}
            className="brand-tile"
            onClick={(e) => {
              // short press animation then call handler quickly so navigation feels snappy
              gsap.fromTo(e.currentTarget, { scale: 0.98 }, { scale: 1, duration: 0.12, ease: 'power3.out' })
              // minimal delay before navigating to showroom to keep feel responsive
              window.setTimeout(() => onSelect(b.id), 80)
            }}
            aria-label={`Select ${b.name}`}
          >
            <div className="brand-frame" aria-hidden>
              <div className="brand-logo">{b.logo ? <img src={b.logo} alt="" /> : null}</div>
            </div>
            <div className="brand-name">{b.name}</div>
          </button>
        ))}
      </div>
      <div className="brands-underline" aria-hidden />
      <div className="brands-bottom">{ (children as any) }</div>
    </section>
  )
})

export default BrandSelection
