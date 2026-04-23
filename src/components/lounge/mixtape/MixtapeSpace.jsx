import { useState, useEffect } from 'react'
import { subscribeToMixtape, VIBE_OPTIONS } from '../../../hooks/useMixtape'
import { getAllGuestProfiles } from '../../../hooks/useGuestProfiles'
import SongCard from './SongCard'
import SongComposer from './SongComposer'
import ExportModal from './ExportModal'

const SORT_OPTIONS = [
  { value: 'top',    label: '♥ Most Wanted' },
  { value: 'newest', label: '✦ Newest' },
]

/**
 * The Mixtape tab — guests suggest songs, upvote favourites, and add comments.
 * Admins see an export button to pull the top 20 for the DJ.
 */
export default function MixtapeSpace({ currentGuest, currentUser, isAdmin }) {
  const [songs,        setSongs]        = useState([])
  const [profiles,     setProfiles]     = useState({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [sort,         setSort]         = useState('top')
  const [vibeFilter,   setVibeFilter]   = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [showExport,   setShowExport]   = useState(false)

  // Load guest profiles once for avatars
  useEffect(() => {
    getAllGuestProfiles()
      .then(list => {
        const map = {}
        list.forEach(p => { map[p.id] = p })
        setProfiles(map)
      })
      .catch(() => {})
  }, [])

  // Real-time song subscription
  useEffect(() => {
    const unsub = subscribeToMixtape({
      onUpdate: data => { setSongs(data); setLoading(false) },
      onError:  ()   => { setError('Could not load the mixtape. Please refresh.'); setLoading(false) },
    })
    return unsub
  }, [])

  // Client-side sort and filter (server already sorts by score desc for 'top')
  const displaySongs = (() => {
    let list = [...songs]
    if (vibeFilter) list = list.filter(s => s.vibe === vibeFilter)
    if (sort === 'newest') {
      list.sort((a, b) => {
        const tA = a.createdAt?.toDate?.().getTime() ?? 0
        const tB = b.createdAt?.toDate?.().getTime() ?? 0
        return tB - tA
      })
    }
    return list
  })()

  return (
    <section className="py-8 px-4 md:px-6 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="text-center mb-8">
        <p className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase mb-2">
          Reception Playlist
        </p>
        <h2 className="font-serif text-palmetto text-4xl text-pressed mb-3">
          The Mixtape
        </h2>
        <p className="font-sans text-sage text-sm leading-relaxed max-w-sm mx-auto">
          Help us build the perfect playlist! Suggest a song and upvote the ones you want to hear.
          The top picks will be on at the reception.
        </p>
      </div>

      {/* ── Suggest a Song composer ── */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setComposerOpen(v => !v)}
          className={`w-full flex items-center justify-between px-5 py-3.5 rounded-lg border transition-all font-sans text-sm ${
            composerOpen
              ? 'border-palmetto/30 bg-palmetto/5 text-palmetto'
              : 'border-sage/25 hover:border-sage/50 text-sage'
          }`}
        >
          <span>
            <span className="text-lg mr-2">🎵</span>
            Suggest a song
          </span>
          <span className="text-xl leading-none">{composerOpen ? '↑' : '+'}</span>
        </button>
        {composerOpen && (
          <div className="mt-3 p-5 bg-sage/5 border border-sage/15 rounded-lg">
            <SongComposer
              currentGuest={currentGuest}
              currentUser={currentUser}
              onSaved={() => setComposerOpen(false)}
            />
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        {/* Sort toggle */}
        <div className="flex rounded-lg border border-sage/20 overflow-hidden shrink-0">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setSort(o.value)}
              className={`px-3 py-1.5 font-sans text-xs transition-colors ${
                sort === o.value
                  ? 'bg-palmetto text-paper'
                  : 'text-sage hover:text-palmetto bg-paper'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Vibe filter pills */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {VIBE_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setVibeFilter(v => v === o.value ? null : o.value)}
              className={`px-2.5 py-1 rounded-full font-sans text-[11px] border transition-all ${
                vibeFilter === o.value
                  ? 'bg-palmetto text-paper border-palmetto'
                  : 'text-sage/70 border-sage/25 hover:border-sage bg-paper'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Admin export */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="font-sans text-xs text-sage hover:text-palmetto transition-colors border border-sage/25 rounded px-3 py-1.5 shrink-0"
          >
            Export Top 20
          </button>
        )}
      </div>

      {/* ── Song count ── */}
      {!loading && songs.length > 0 && (
        <p className="font-sans text-[11px] text-sage/50 mb-4">
          {songs.length} song{songs.length !== 1 ? 's' : ''} on the list
          {vibeFilter && ' · filtered by vibe'}
        </p>
      )}

      {/* ── Feed ── */}
      {loading && (
        <div className="text-center py-12">
          <p className="font-sans text-sage text-sm">Loading the mixtape…</p>
        </div>
      )}
      {error && (
        <p className="font-sans text-red-400 text-sm text-center py-12">{error}</p>
      )}
      {!loading && !error && displaySongs.length === 0 && (
        <div className="text-center py-12">
          <p className="font-serif text-palmetto text-xl text-pressed mb-2">
            {vibeFilter ? 'No songs with that vibe yet!' : 'Be the first!'}
          </p>
          <p className="font-sans text-sage text-sm">
            {vibeFilter
              ? 'Try a different filter or suggest one above.'
              : 'Suggest a song above to kick off the reception playlist.'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {displaySongs.map(song => (
          <SongCard
            key={song.id}
            song={song}
            profiles={profiles}
            currentUid={currentUser?.uid}
            currentGuest={currentGuest}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </section>
  )
}
