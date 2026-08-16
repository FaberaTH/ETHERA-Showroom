export type CarItem = { id: string; title: string; src: string; align: 'left' | 'right' }

function tidyTitle(filename: string) {
  // remove extension and trailing -e/-d markers, replace hyphens with spaces, capitalize words
  const name = filename.replace(/\.(jpg|png|jpeg)$/i, '').replace(/-([ed])$/i, '')
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

export function getCarsForBrand(brandId: string) {
  const base = new URL('../../assets_veicles/photo_cars', import.meta.url).href
  const map: Record<string, string[]> = {
    porsche: ['spyder-d.jpg', 'taycan-turbo-e.jpg', '911-gt3-rs-d.jpg'],
    ferrari: ['sf90-Stradale-d.jpg', 'roma-e.jpg', 'laFerrari-d.jpg'],
    bmw: ['m4-d.jpg', 'm8-e.jpg', 'i8-d.jpg'],
    mclaren: ['Senna-d.jpg', 'P1-e.jpg', '720S-d.jpg'],
    aston: ['vantage-d.jpg', 'dbs-superleggera-e.jpg', 'valkyre-d.jpg'],
  }

  const files = map[brandId] || []
  return files.map((f, i) => {
    const align = /-e\./i.test(f) ? 'right' : 'left'
    return {
      id: `${brandId}-${i}`,
      title: tidyTitle(f),
      // Use root-relative path for static assets to avoid resolution differences
      // across environments (dev server / build). Files are stored under
      // /assets_veicles/photo_cars/<brand>/*.jpg
      src: `/assets_veicles/photo_cars/${brandId}/${f}`,
      align,
    } as CarItem
  })
}

// Search across all brands and return matching car items with brand context
export function searchCars(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return [] as Array<{ brandId: string; car: CarItem }>

  const map: Record<string, string[]> = {
    porsche: ['spyder-d.jpg', 'taycan-turbo-e.jpg', '911-gt3-rs-d.jpg'],
    ferrari: ['sf90-Stradale-d.jpg', 'roma-e.jpg', 'laFerrari-d.jpg'],
    bmw: ['m4-d.jpg', 'm8-e.jpg', 'i8-d.jpg'],
    mclaren: ['Senna-d.jpg', 'P1-e.jpg', '720S-d.jpg'],
    aston: ['vantage-d.jpg', 'dbs-superleggera-e.jpg', 'valkyre-d.jpg'],
  }

  const results: Array<{ brandId: string; car: CarItem }> = []
  Object.entries(map).forEach(([brand, files]) => {
    files.forEach((f, i) => {
      const title = tidyTitle(f)
      if (title.toLowerCase().includes(q)) {
        const align = /-e\./i.test(f) ? 'right' : 'left'
        results.push({ brandId: brand, car: { id: `${brand}-${i}`, title, src: `/assets_veicles/photo_cars/${brand}/${f}`, align } })
      }
    })
  })
  return results
}
