import { useState, useEffect } from 'react'
import {
  subscribeToSongComments,
  addSongComment,
  editSongComment,
  deleteSongComment,
  toggleSongCommentLike,
} from '../../../hooks/useMixtape'
import { timeAgo } from '../../../utils/richText'

/**
 * Flat comment thread for a mixtape song.
 * Reuses the same visual style as post comments but without @mentions or replies.
 */
export default function MixtapeCommentThread({ song, profiles = {}, currentUid, currentGuest, isAdmin }) {
  const [comments,   setComments]   = useState([])
  const [text,       setText]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsub = subscribeToSongComments({
      songId:   song.id,
      onUpdate: setComments,
    })
    return unsub
  }, [song.id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await addSongComment({
        songId:        song.id,
        content:       text.trim(),
        authorUid:     currentUid,
        authorGuestId: currentGuest.isCouple ? null : currentGuest.id,
        authorName:    currentGuest.name,
        authorRole:    currentGuest.isCouple ? currentGuest.role : 'guest',
      })
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const myProfile = profiles[currentGuest?.id]
  const myAvatar  = myProfile?.selfieUrl ?? null
  const myInitial = currentGuest?.name?.[0] ?? '?'

  return (
    <div className="pt-3 border-t border-sage/10">
      {comments.length === 0 && (
        <p className="font-sans text-[11px] text-sage/40 py-1 mb-2">Be the first to comment!</p>
      )}
      {comments.map(c => (
        <CommentItem
          key={c.id}
          comment={c}
          songId={song.id}
          profiles={profiles}
          currentUid={currentUid}
          isAdmin={isAdmin}
        />
      ))}

      {/* Composer */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
        <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden border border-sage/10 bg-sage/20 flex items-center justify-center text-xs font-serif text-sage">
          {myAvatar
            ? <img src={myAvatar} alt="" className="w-full h-full object-cover" />
            : myInitial
          }
        </div>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 bg-sage/5 border border-sage/15 rounded-full px-4 py-1.5 font-sans text-sm text-palmetto focus:outline-none focus:ring-1 focus:ring-sage/40"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="font-sans text-xs text-palmetto hover:text-palmetto/70 transition-colors disabled:opacity-40"
        >
          Post
        </button>
      </form>
    </div>
  )
}

function CommentItem({ comment, songId, profiles, currentUid, isAdmin }) {
  const [likeCount, setLikeCount] = useState(comment.likes?.length ?? 0)
  const [liked,     setLiked]     = useState((comment.likes ?? []).includes(currentUid))
  const [editing,   setEditing]   = useState(false)
  const [editText,  setEditText]  = useState(comment.content)
  const [deleted,   setDeleted]   = useState(false)

  if (deleted) return null

  const isOwn     = comment.authorUid === currentUid
  const firstName = comment.authorName?.split(' ')[0] ?? '?'
  const selfieUrl = comment.authorGuestId ? profiles[comment.authorGuestId]?.selfieUrl ?? null : null
  const isCouple  = comment.authorRole === 'bride' || comment.authorRole === 'groom'

  async function handleLike() {
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => prev ? c - 1 : c + 1)
    try {
      await toggleSongCommentLike(songId, comment.id, currentUid)
    } catch {
      setLiked(prev)
      setLikeCount(c => prev ? c + 1 : c - 1)
    }
  }

  async function handleSave() {
    if (!editText.trim()) return
    await editSongComment(songId, comment.id, editText.trim())
    setEditing(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this comment?')) return
    setDeleted(true)
    await deleteSongComment(songId, comment.id)
  }

  return (
    <div className="flex gap-2.5 mt-2.5">
      <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden border border-sage/10 bg-sage/20 flex items-center justify-center text-xs font-serif text-sage">
        {selfieUrl
          ? <img src={selfieUrl} alt={firstName} className="w-full h-full object-cover" />
          : firstName[0]
        }
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`inline-block rounded-2xl rounded-tl-sm px-3 py-2 max-w-full ${
            isCouple
              ? 'bg-sunrise-pink/15 border border-sunrise-pink/30'
              : 'border border-sage/10'
          }`}
          style={{ background: isCouple ? undefined : 'rgba(138,154,134,0.06)' }}
        >
          <span className="font-sans font-semibold text-palmetto text-xs mr-1.5">{firstName}</span>
          {isCouple && (
            <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-sunrise-orange mr-1.5">
              {comment.authorRole === 'bride' ? '♡ Bride' : '♡ Groom'}
            </span>
          )}
          {editing ? (
            <div className="mt-1.5">
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full bg-paper border border-sage/30 rounded px-2 py-1 text-sm font-sans text-palmetto focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button onClick={handleSave} className="text-[10px] font-sans text-palmetto hover:underline">Save</button>
                <button onClick={() => setEditing(false)} className="text-[10px] font-sans text-sage hover:underline">Cancel</button>
              </div>
            </div>
          ) : (
            <span className="font-sans text-palmetto text-sm">{comment.content}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 pl-1">
          <button
            onClick={handleLike}
            className={`font-sans text-[10px] transition-colors ${liked ? 'text-sunrise-orange' : 'text-sage/60 hover:text-sage'}`}
          >
            {liked ? '♥' : '♡'}{likeCount > 0 ? ` ${likeCount}` : ''}
          </button>
          <span className="font-sans text-[10px] text-sage/40">
            {timeAgo(comment.createdAt)}
          </span>
          {(isOwn || isAdmin) && !editing && (
            <>
              {isOwn && (
                <button onClick={() => setEditing(true)} className="font-sans text-[10px] text-sage/40 hover:text-sage transition-colors">
                  Edit
                </button>
              )}
              <button onClick={handleDelete} className="font-sans text-[10px] text-sage/40 hover:text-red-400 transition-colors">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
