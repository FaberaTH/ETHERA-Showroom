import React, { useRef, useState } from 'react'
import Hero from '../components/Hero'
import BrandSelection, { Brand } from '../components/BrandSelection'
import SearchBar from '../components/SearchBar'
import { getCarsForBrand } from '../data/carIndex'
import Showroom from '../components/Showroom'
import { searchCars } from '../data/carIndex'
import { goToBrands, goToShowroom, backToBrands } from './collection-logic'

export default function Home() {
  const brandsRef = useRef<HTMLElement | null>(null)
  const showroomRef = useRef<HTMLElement | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  React.useEffect(() => {
    // ensure brands panel is hidden initially until animation shows it
    const el = brandsRef.current
    if (el) el.style.display = 'none'
  }, [])

  const brands: Brand[] = [
    { id: 'aston', name: 'Aston Martin', logo: new URL('../../assets_veicles/logos_cars/aston-icon.png', import.meta.url).href },
    { id: 'bmw', name: 'BMW', logo: new URL('../../assets_veicles/logos_cars/bmw-icon.png', import.meta.url).href },
    { id: 'ferrari', name: 'Ferrari', logo: new URL('../../assets_veicles/logos_cars/ferrari-icon.png', import.meta.url).href },
    { id: 'mclaren', name: 'McLaren', logo: new URL('../../assets_veicles/logos_cars/mclaren_icon.png', import.meta.url).href },
    { id: 'porsche', name: 'Porsche', logo: new URL('../../assets_veicles/logos_cars/porsche-icon.png', import.meta.url).href },
  ]

  const handleExplore = () => {
    const heroEl = document.querySelector('.hero-root') as HTMLElement | null
    goToBrands({ heroEl, brandsEl: brandsRef.current })
  }

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrand(brandId)
    goToShowroom({ brandsEl: brandsRef.current, showroomEl: showroomRef.current, brandId })
  }

  const handleQuery = (q: string) => setQuery(q)

  // suggestions derived from global car search
  const suggestions = React.useMemo(() => {
    if (!query || query.trim().length === 0) return []
    const results = searchCars(query)
    // debug
    try { console.debug('search suggestions for', query, results) } catch (e) {}
    // map to suggestion shape
    return results.slice(0, 6).map(r => ({ label: r.car.title, brandId: r.brandId, carId: r.car.id }))
  }, [query])

  const handleSelectSuggestion = (s: { label: string; brandId: string; carId: string }) => {
    // open the showroom for the brand and scroll to the car
    setSelectedBrand(s.brandId)
    const tl = goToShowroom({ brandsEl: brandsRef.current, showroomEl: showroomRef.current, brandId: s.brandId })
    // after a short delay, scroll the car into view inside the portal
    setTimeout(() => {
      const el = document.getElementById(s.carId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 500)
  }

  return (
    <div className="page-root">
      <Hero onExplore={handleExplore} />

      {/* Brand selection container (initially hidden) */}
      <BrandSelection ref={(el) => (brandsRef.current = el)} brands={brands} onSelect={handleSelectBrand}>
        <div style={{ maxWidth: 920, margin: '26px auto 0', padding: '0 6vw' }}>
          <SearchBar placeholder="Find your new obsession" onQueryChange={handleQuery} suggestions={suggestions} onSelectSuggestion={handleSelectSuggestion} />
        </div>
      </BrandSelection>

      {/* Showroom container (initially hidden). Uses .showroom-panel for consistent styling/positioning */}
      <div ref={(el) => (showroomRef.current = el)} className="showroom-panel" aria-hidden="true">
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
          {/* Showroom will lazy-load car list for the selected brand */}
          <Showroom
            brandId={selectedBrand ?? ''}
            brandName={selectedBrand ? (brands.find(b => b.id === selectedBrand)?.name ?? '') : ''}
            brandLogo={selectedBrand ? (brands.find(b => b.id === selectedBrand)?.logo ?? '') : ''}
            carList={selectedBrand ? getCarsForBrand(selectedBrand) : []}
            query={query}
            onBack={() => {
            // when the showroom requests back, animate back and clear selection
            backToBrands({ showroomEl: showroomRef.current, brandsEl: brandsRef.current })
            setSelectedBrand(null)
          }} />
        </div>
      </div>
    </div>
  )
}
