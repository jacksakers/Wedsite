import { useState } from 'react'
import { addSong, VIBE_OPTIONS } from '../../../hooks/useMixtape'

const INPUT_CLS =
  'w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50'

/**
 * Form for guests to submit a song recommendation to the mixtape.
 * Automatically detects duplicates and converts them into upvotes.
 */
export default function SongComposer({ currentGuest, currentUser, onSaved }) {
  const [songTitle,  setSongTitle]  = useState('')
  const [artist,     setArtist]     = useState('')
  const [vibe,       setVibe]       = useState('')
  const [customVibe, setCustomVibe] = useState('')
  const [note,       setNote]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [feedback,   setFeedback]   = useState(null) // { type: 'success'|'info'|'error', msg }

  const coupleRole = currentGuest?.isCouple ? currentGuest.role : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!songTitle.trim() || !artist.trim()) return
    setSaving(true)
    setFeedback(null)
    const finalVibe = vibe === 'other' ? customVibe.trim() : vibe
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
        setSongTitle('')
        setArtist('')
        setVibe('')
        setCustomVibe('')
        setNote('')
        onSaved?.()
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={songTitle}
          onChange={e => setSongTitle(e.target.value)}
          placeholder="Song title *"
          className={INPUT_CLS}
          autoComplete="off"
        />
        <input
          type="text"
          value={artist}
          onChange={e => setArtist(e.target.value)}
          placeholder="Artist *"
          className={INPUT_CLS}
          autoComplete="off"
        />
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

      {vibe === 'other' && (
        <input
          type="text"
          value={customVibe}
          onChange={e => setCustomVibe(e.target.value)}
          placeholder="Describe the vibe…"
          className={INPUT_CLS}
          autoComplete="off"
        />
      )}

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
          disabled={saving || !songTitle.trim() || !artist.trim()}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-8 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add to Mixtape'}
        </button>
      </div>
    </form>
  )
}
