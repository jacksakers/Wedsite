import { useState, useEffect } from 'react'
import { getTopSongs } from '../../../hooks/useMixtape'

/**
 * Admin-only modal showing the top 20 songs with copy-to-clipboard
 * and individual Spotify search links.
 */
export default function ExportModal({ onClose }) {
  const [songs,   setSongs]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    getTopSongs(20)
      .then(setSongs)
      .catch(err => { console.error('[ExportModal] getTopSongs failed:', err); setSongs([]) })
      .finally(() => setLoading(false))
  }, [])

  function buildText() {
    if (!songs) return ''
    return songs
      .map((s, i) => `${i + 1}. "${s.songTitle}" by ${s.artist}  (${s.upvoteCount ?? 0} votes)`)
      .join('\n')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: select a textarea
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-xl paper-lift max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage/15">
          <div>
            <h2 className="font-serif text-palmetto text-xl text-pressed">Top 20 Songs</h2>
            <p className="font-sans text-[11px] text-sage/60 mt-0.5">Sorted by total votes</p>
          </div>
          <button onClick={onClose} className="text-sage hover:text-palmetto transition-colors text-xl leading-none">✕</button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading && (
            <p className="font-sans text-sage text-sm text-center py-8">Loading…</p>
          )}
          {!loading && songs?.length === 0 && (
            <p className="font-sans text-sage text-sm text-center py-8">No songs yet!</p>
          )}
          {songs && songs.length > 0 && (
            <ol className="space-y-2.5">
              {songs.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-sans text-xs text-sage/50 w-5 shrink-0 text-right tabular-nums">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-sans text-palmetto text-sm font-medium truncate">{s.songTitle}</p>
                      <p className="font-sans text-sage text-xs truncate">{s.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-sans text-xs text-sage/50 tabular-nums">{s.upvoteCount ?? 0}♥</span>
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(`${s.songTitle} ${s.artist}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-[11px] text-sage/40 hover:text-[#1DB954] transition-colors"
                    >
                      Spotify ↗
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {songs && songs.length > 0 && (
            <div className="mt-5 p-4 bg-sage/5 border border-sage/15 rounded-lg">
              <p className="font-sans text-xs text-sage leading-relaxed">
                <span className="font-semibold text-palmetto">Building the playlist:</span>
                {' '}Click "Spotify ↗" next to each song to find it, then save it to a new playlist.
                Or copy the list below and share it with your DJ!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sage/15 flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!songs || songs.length === 0}
            className="flex-1 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2.5 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
          >
            {copied ? '✓ Copied!' : 'Copy List to Clipboard'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-sage/30 rounded font-sans text-xs text-sage hover:border-sage transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
