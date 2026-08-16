import React, { useCallback, useRef, useState, useEffect } from 'react'

type Suggestion = { label: string; brandId: string; carId: string }

type Props = {
  placeholder?: string
  onQueryChange?: (q: string) => void
  suggestions?: Suggestion[]
  onSelectSuggestion?: (s: Suggestion) => void
}

export default function SearchBar({ placeholder = 'Find your new obsession', onQueryChange, suggestions = [], onSelectSuggestion }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [value, setValue] = useState('')
  const [active, setActive] = useState(-1)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(value.trim().length > 0 && suggestions.length > 0)
    setActive(-1)
  }, [suggestions, value])

  // debug
  useEffect(() => {
    try { console.debug('SearchBar props', { value, suggestions, open }) } catch (e) {}
  }, [value, suggestions, open])

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    onQueryChange?.(v)
  }, [onQueryChange])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && suggestions[active]) select(suggestions[active])
    }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1) }
  }

  const select = (s: Suggestion) => {
    setValue(s.label)
    setOpen(false)
    onSelectSuggestion?.(s)
  }

  return (
    <div className="searchbar-root" style={{ position: 'relative' }}>
      <label className="sr-only">Search</label>
      <div className="search-field">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={onInput}
          onKeyDown={onKeyDown}
          aria-label="Search showroom"
        />
      </div>

      {open && (
        <ul className="search-suggestions" role="listbox" aria-label="Search suggestions">
          {suggestions.map((s, i) => (
            <li key={`${s.brandId}-${s.carId}`} role="option" aria-selected={i === active} className={`search-suggestion ${i === active ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); select(s) }}>
              <strong style={{ marginRight: 8 }}>{s.label}</strong>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.brandId.toUpperCase()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
