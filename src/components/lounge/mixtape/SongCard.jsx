import { useState, useEffect } from 'react'
import { toggleSongUpvote, fetchAlbumArt, deleteSong, VIBE_OPTIONS } from '../../../hooks/useMixtape'
import { createNotification } from '../../../hooks/useNotifications'
import MixtapeCommentThread from './MixtapeCommentThread'

const VIBE_COLORS = {
  slow_dance: 'bg-blue-50 text-blue-700 border-blue-200',
  energetic:  'bg-orange-50 text-orange-700 border-orange-200',
  romantic:   'bg-pink-50 text-pink-700 border-pink-200',
  feel_good:  'bg-green-50 text-green-700 border-green-200',
  line_dance: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  party:      'bg-purple-50 text-purple-700 border-purple-200',
  other:      'bg-sage/10 text-sage border-sage/25',
}

/** Single song card — album art, upvote, vibe/couple badges, note, comments. */
export default function SongCard({ song, profiles = {}, currentUid, currentGuest, isAdmin }) {
  const serverVoted = (song.upvotes ?? []).includes(currentUid)
  const [voted,        setVoted]        = useState(serverVoted)
  const [showComments, setShowComments] = useState(false)
  const [albumArt,     setAlbumArt]     = useState(null)
  const [artLoading,   setArtLoading]   = useState(true)
  const [deleted,      setDeleted]      = useState(false)

  // Optimistic count: apply local delta on top of server value so concurrent
  // upvotes from other users (via real-time listener) still show correctly.
  const displayCount = (song.upvoteCount ?? 0) + (voted !== serverVoted ? (voted ? 1 : -1) : 0)

  const coupleRole       = currentGuest?.isCouple ? currentGuest.role : null
  const canDelete        = song.requestedByUid === currentUid || isAdmin
  const requesterSelfie  = song.requestedByGuestId
    ? profiles[song.requestedByGuestId]?.selfieUrl ?? null
    : null
  const requesterFirst   = song.requestedByName?.split(' ')[0] ?? song.requestedByName
  const isRequesterCouple = song.requestedByRole === 'bride' || song.requestedByRole === 'groom'

  const coupleBadge = (song.brideVoted && song.groomVoted)
    ? '♡ Both Approve!'
    : song.brideVoted ? '♡ Bride Approved'
    : song.groomVoted ? '♡ Groom Approved'
    : null

  const vibeLabel = VIBE_OPTIONS.find(v => v.value === song.vibe)?.label ?? (song.vibe || null)
  const vibeColor = VIBE_COLORS[song.vibe] ?? VIBE_COLORS.other

  // Lazy-load album art once per card render
  useEffect(() => {
    let cancelled = false
    fetchAlbumArt(song.artist, song.songTitle)
      .then(url => { if (!cancelled) setAlbumArt(url) })
      .finally(() => { if (!cancelled) setArtLoading(false) })
    return () => { cancelled = true }
  }, [song.artist, song.songTitle])

  if (deleted) return null

  async function handleUpvote() {
    const prev = voted
    setVoted(!prev)
    try {
      const result = await toggleSongUpvote(song.id, currentUid, coupleRole)
      if (result.wasFirst) {
        await createNotification({
          recipientUid: song.requestedByUid,
          type:         'upvote_song',
          actorName:    currentGuest.name,
          actorUid:     currentUid,
          actorGuestId: currentGuest.isCouple ? null : currentGuest.id,
          postId:       song.id,
          postSnippet:  `${song.songTitle} by ${song.artist}`,
        })
      }
    } catch {
      setVoted(prev)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remove this song from the mixtape?')) return
    setDeleted(true)
    await deleteSong(song.id)
  }

  return (
    <div className="bg-paper border border-sage/15 rounded-lg paper-lift overflow-hidden">
      {/* Card body */}
      <div className="flex gap-3 p-4">
        {/* Album art */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden shrink-0 bg-sage/10 flex items-center justify-center">
          {artLoading ? (
            <div className="w-full h-full bg-sage/10 animate-pulse rounded-md" />
          ) : albumArt ? (
            <img src={albumArt} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-7 h-7 text-sage/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-serif text-palmetto text-lg leading-tight text-pressed">{song.songTitle}</h3>
              <p className="font-sans text-sage/80 text-sm">{song.artist}</p>
            </div>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-sage/30 hover:text-red-400 transition-colors shrink-0 text-sm leading-none mt-0.5"
                title="Remove song"
              >
                ✕
              </button>
            )}
          </div>

          {/* Vibe + couple badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {vibeLabel && (
              <span className={`font-sans text-[10px] tracking-[0.1em] px-2 py-0.5 rounded-full border ${vibeColor}`}>
                {vibeLabel}
              </span>
            )}
            {coupleBadge && (
              <span className="font-sans text-[10px] tracking-[0.1em] px-2 py-0.5 rounded-full bg-sunrise-pink/15 text-sunrise-orange border border-sunrise-pink/30">
                {coupleBadge}
              </span>
            )}
          </div>

          {/* Requester */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-sage/15 bg-sage/20 flex items-center justify-center text-[9px] font-serif text-sage shrink-0">
              {requesterSelfie
                ? <img src={requesterSelfie} alt="" className="w-full h-full object-cover" />
                : requesterFirst?.[0] ?? '?'
              }
            </div>
            <span className="font-sans text-[11px] text-sage/60">
              Recommended by{' '}
              <span className={`font-semibold ${isRequesterCouple ? 'text-sunrise-orange' : 'text-palmetto/80'}`}>
                {requesterFirst}
                {isRequesterCouple && (
                  <span className="ml-0.5 text-[9px] tracking-widest uppercase opacity-60">
                    ({song.requestedByRole})
                  </span>
                )}
              </span>
            </span>
          </div>

          {/* Note */}
          {song.note && (
            <p className="font-sans text-xs text-sage/60 italic mt-1.5 leading-relaxed">
              "{song.note}"
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-4 pt-2 pb-3 border-t border-sage/8">
        {/* Upvote */}
        <button
          onClick={handleUpvote}
          className={`flex items-center gap-1.5 font-sans text-xs transition-all active:scale-95 ${
            voted ? 'text-sunrise-orange' : 'text-sage/60 hover:text-palmetto'
          }`}
          aria-label={voted ? 'Remove upvote' : 'Upvote this song'}
        >
          <span className="text-base leading-none">{voted ? '♥' : '♡'}</span>
          <span className="tabular-nums">{displayCount}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(v => !v)}
          className={`flex items-center gap-1.5 font-sans text-xs transition-colors ${
            showComments ? 'text-palmetto' : 'text-sage/60 hover:text-palmetto'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{song.commentCount ?? 0}</span>
        </button>

        {/* Spotify search */}
        <a
          href={`https://open.spotify.com/search/${encodeURIComponent(`${song.songTitle} ${song.artist}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 font-sans text-[10px] text-sage/40 hover:text-[#1DB954] transition-colors"
          title="Find on Spotify"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Find on Spotify
        </a>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4">
          <MixtapeCommentThread
            song={song}
            profiles={profiles}
            currentUid={currentUid}
            currentGuest={currentGuest}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  )
}
