import { useState, useEffect, useRef } from 'react'
import { subscribeToVaultPhotos } from '../hooks/useVaultPhotos'

const INTERVAL_MS   = 5000   // time each photo is shown
const TRANSITION_MS = 800    // fade duration

/** Fisher-Yates shuffle — returns a new array */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Slideshow() {
  const [photos,  setPhotos]  = useState([])    // shuffled deck
  const [index,   setIndex]   = useState(0)     // current position
  const [visible, setVisible] = useState(true)  // for fade
  const [error,   setError]   = useState('')
  const [empty,   setEmpty]   = useState(false)

  // Track IDs we've already shuffled in so new arrivals are appended
  const seenIds  = useRef(new Set())
  const timerRef = useRef(null)

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToVaultPhotos({
      onUpdate: incoming => {
        if (incoming.length === 0) { setEmpty(true); return }
        setEmpty(false)

        // Find truly new photos (not yet in our deck)
        const newPhotos = incoming.filter(p => !seenIds.current.has(p.id))
        if (newPhotos.length === 0) return

        newPhotos.forEach(p => seenIds.current.add(p.id))

        setPhotos(prev => {
          if (prev.length === 0) {
            // First load — shuffle everything
            return shuffle(incoming)
          }
          // Append new arrivals in random positions to keep things fresh
          const appended = [...prev]
          for (const p of shuffle(newPhotos)) {
            const pos = Math.floor(Math.random() * (appended.length + 1))
            appended.splice(pos, 0, p)
          }
          return appended
        })
      },
      onError: () => setError('Could not load photos.'),
    })
    return unsub
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (photos.length === 0) return

    timerRef.current = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % photos.length)
        setVisible(true)
      }, TRANSITION_MS)
    }, INTERVAL_MS)

    return () => clearInterval(timerRef.current)
  }, [photos])

  const current = photos[index] ?? null
  const firstName = current?.uploaderName?.split(' ')[0] ?? current?.uploaderName ?? ''

  // ── Empty / loading states ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-svh bg-black flex items-center justify-center">
        <p className="font-sans text-white/50 text-sm">{error}</p>
      </div>
    )
  }

  if (empty || (photos.length === 0 && !error)) {
    return (
      <div className="min-h-svh bg-black flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-white/70 text-3xl">No photos yet</p>
        <p className="font-sans text-white/40 text-sm">
          Guests can upload photos from the Lounge → Photos tab
        </p>
      </div>
    )
  }

  // ── Slideshow ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh bg-black relative overflow-hidden select-none" style={{ zIndex: 110 }}>

      {/* Current photo */}
      {current && (
        <div
          key={current.id}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity:    visible ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
          }}
        >
          <img
            src={current.url}
            alt=""
            className="max-h-svh max-w-full object-contain"
            draggable={false}
          />

          {/* Gradient overlay for text legibility */}
          <div
            className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
            }}
          />

          {/* Uploader name */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="font-sans text-white/90 text-sm tracking-wide drop-shadow">
                📷 {firstName}
              </span>
            </div>
            {/* Dot indicator */}
            <div className="flex gap-1.5 items-center opacity-50">
              {photos.slice(0, Math.min(photos.length, 12)).map((_, i) => (
                <span
                  key={i}
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width:  i === index % Math.min(photos.length, 12) ? 8 : 4,
                    height: i === index % Math.min(photos.length, 12) ? 8 : 4,
                    background: i === index % Math.min(photos.length, 12) ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preload next photo silently */}
      {photos[(index + 1) % photos.length] && (
        <img
          src={photos[(index + 1) % photos.length].url}
          alt=""
          className="hidden"
        />
      )}

      {/* Photo count badge */}
      <div className="absolute top-4 right-4 font-sans text-[11px] text-white/40 tracking-widest">
        {index + 1} / {photos.length}
      </div>
    </div>
  )
}
