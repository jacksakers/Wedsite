import { useState, useEffect, useRef } from 'react'
import { addSong, VIBE_OPTIONS } from '../../../hooks/useMixtape'

const INPUT_CLS =
  'w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50'

/** Query the iTunes Search API. Returns up to 6 track results. */
async function searchItunes(term) {
  if (!term.trim()) return []
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&limit=6&entity=song&media=music`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map(r => ({
      trackName:   r.trackName,
      artistName:  r.artistName,
      artworkUrl:  r.artworkUrl100?.replace('100x100bb', '300x300bb') ?? null,
      trackId:     r.trackId,
    }))
  } catch {
    return []
  }
}

/**
 * Form for guests to submit a song recommendation to the mixtape.
 * Live iTunes search lets guests find tracks by typing in one box.
 * Automatically detects duplicates and converts them into upvotes.
 */
export default function SongComposer({ currentGuest, currentUser, onSaved }) {
  const [query,       setQuery]       = useState('')         // search input
  const [results,     setResults]     = useState([])         // iTunes hits
  const [searching,   setSearching]   = useState(false)
  const [selected,    setSelected]    = useState(null)       // { trackName, artistName, artworkUrl }
  const [vibe,        setVibe]        = useState('')
  const [note,        setNote]        = useState('')
  const [saving,      setSaving]      = useState(false)
  const [feedback,    setFeedback]    = useState(null)       // { type, msg }
  const [showResults, setShowResults] = useState(false)
  const debounceRef  = useRef(null)
  const wrapperRef   = useRef(null)

  const coupleRole = currentGuest?.isCouple ? currentGuest.role : null

  // Debounced iTunes search
  useEffect(() => {
    if (selected) return           // don't re-search once a track is picked
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setShowResults(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const hits = await searchItunes(query)
      setResults(hits)
      setShowResults(hits.length > 0)
      setSearching(false)
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, selected])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(track) {
    setSelected(track)
    setQuery(track.trackName)
    setResults([])
    setShowResults(false)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const songTitle = selected ? selected.trackName  : query.trim()
    const artist    = selected ? selected.artistName : ''
    if (!songTitle || !artist) return
    setSaving(true)
    setFeedback(null)
    const finalVibe = vibe
    try {
      const result = await addSong({
        songTitle,
        artist,
        note,
        vibe: finalVibe,
        requestedByUid:     currentUser.uid,
        requestedByGuestId: currentGuest.isCouple ? null : currentGuest.id,
        requestedByName:    currentGuest.name,
        requestedByRole:    coupleRole ?? 'guest',
      })
      if (result.wasUpvote) {
        setFeedback({
          type: 'info',
          msg: result.alreadyVoted
            ? 'You already voted for this one!'
            : 'That song is already on the list — we added your upvote! 🎵',
        })
      } else {
        setFeedback({ type: 'success', msg: '🎵 Added to the mixtape!' })
        handleClear()
        setVibe('')
        setNote('')
        onSaved?.()
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const songTitle = selected ? selected.trackName  : query.trim()
  const artist    = selected ? selected.artistName : ''
  const canSubmit = !saving && songTitle && artist

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">

      {/* ── Search / selected track ── */}
      <div ref={wrapperRef} className="relative">
        {selected ? (
          /* Confirmed selection card */
          <div className="flex items-center gap-3 border border-sage/30 rounded px-3 py-2.5 bg-sage/5">
            {selected.artworkUrl && (
              <img
                src={selected.artworkUrl}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-palmetto text-sm font-medium truncate">{selected.trackName}</p>
              <p className="font-sans text-sage text-xs truncate">{selected.artistName}</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="font-sans text-xs text-sage/60 hover:text-palmetto transition-colors shrink-0 ml-2"
            >
              Change
            </button>
          </div>
        ) : (
          /* Live search input */
          <>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Search for a song or artist…"
                className={INPUT_CLS}
                autoComplete="off"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[10px] text-sage/50 animate-pulse">
                  Searching…
                </span>
              )}
            </div>

            {/* Dropdown results */}
            {showResults && (
              <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-paper border border-sage/20 rounded-lg shadow-xl overflow-hidden">
                {results.map(track => (
                  <li key={track.trackId}>
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); handleSelect(track) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sage/8 transition-colors text-left"
                    >
                      {track.artworkUrl ? (
                        <img
                          src={track.artworkUrl}
                          alt=""
                          className="w-9 h-9 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-sage/15 shrink-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-sage/40" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-sans text-palmetto text-sm font-medium truncate">{track.trackName}</p>
                        <p className="font-sans text-sage text-xs truncate">{track.artistName}</p>
                      </div>
                    </button>
                  </li>
                ))}
                {/* Manual entry fallback */}
                {query.trim() && (
                  <li className="border-t border-sage/10">
                    <button
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault()
                        handleSelect({ trackName: query.trim(), artistName: '', artworkUrl: null, trackId: 'manual' })
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-sage/8 transition-colors text-left"
                    >
                      <span className="font-sans text-sage text-xs italic">
                        Can't find it? Add "{query.trim()}" manually →
                      </span>
                    </button>
                  </li>
                )}
              </ul>
            )}
          </>
        )}

        {/* Artist override — shown when manually entering (no iTunes match) */}
        {selected?.trackId === 'manual' && (
          <input
            type="text"
            value={selected.artistName}
            onChange={e => setSelected(s => ({ ...s, artistName: e.target.value }))}
            placeholder="Artist *"
            className={`${INPUT_CLS} mt-2`}
            autoComplete="off"
          />
        )}
      </div>

      {/* Vibe selector */}
      <div>
        <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-sage/60 mb-2">
          What's the vibe?
        </p>
        <div className="flex flex-wrap gap-2">
          {VIBE_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setVibe(v => v === o.value ? '' : o.value)}
              className={`px-3 py-1.5 rounded-full font-sans text-xs transition-all border ${
                vibe === o.value
                  ? 'bg-palmetto text-paper border-palmetto'
                  : 'text-sage border-sage/30 hover:border-sage bg-paper'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Why would this song be perfect for the reception? (optional)"
        rows={2}
        className={`${INPUT_CLS} resize-none`}
      />

      {feedback && (
        <p className={`font-sans text-sm ${
          feedback.type === 'success' ? 'text-palmetto'
          : feedback.type === 'info' ? 'text-sage'
          : 'text-red-500'
        }`}>
          {feedback.msg}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-8 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add to Mixtape'}
        </button>
      </div>
    </form>
  )
}
