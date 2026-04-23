import { useState, useRef } from 'react'
import { editComment, deleteComment, toggleCommentLike, parseHashtags } from '../../../hooks/usePosts'
import { notifyReply, notifyComment } from '../../../hooks/useNotifications'
import { RichText, timeAgo } from '../../../utils/richText'
import MentionInput from './MentionInput'

/**
 * A single comment (or reply) with like, edit, delete, reply actions.
 */
export default function CommentItem({
  comment,
  post,
  profiles = {},
  guests,
  currentUid,
  currentGuest,
  isAdmin,
  indent = false,
  onReply,
}) {
  const [likeCount, setLikeCount] = useState(comment.likes?.length ?? 0)
  const [liked, setLiked]         = useState((comment.likes ?? []).includes(currentUid))
  const [editing, setEditing]     = useState(false)
  const [editText, setEditText]   = useState(comment.content)
  const [editMentions, setEditMentions] = useState(comment.mentions ?? [])
  const [saving, setSaving]       = useState(false)
  const [deleted, setDeleted]     = useState(false)

  const isOwn = comment.authorUid === currentUid
  const firstName = comment.authorName?.split(' ')[0] ?? comment.authorName
  const selfieUrl = comment.authorGuestId ? profiles[comment.authorGuestId]?.selfieUrl ?? null : null

  if (deleted) return null

  async function handleLike() {
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => prev ? c - 1 : c + 1)
    try {
      await toggleCommentLike(post.id, comment.id, currentUid)
    } catch {
      setLiked(prev)
      setLikeCount(c => prev ? c + 1 : c - 1)
    }
  }

  async function handleSaveEdit() {
    if (!editText.trim()) return
    setSaving(true)
    try {
      await editComment(post.id, comment.id, {
        content: editText.trim(),
        mentions: editMentions,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this comment?')) return
    setDeleted(true)
    await deleteComment(post.id, comment.id)
  }

  return (
    <div className={`flex gap-2.5 ${indent ? 'ml-8 mt-2' : 'mt-3'}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full shrink-0 overflow-hidden border border-sage/10 cursor-pointer hover:ring-1 hover:ring-sage/40 transition-all"
        onClick={() => onReply?.(comment)}
        title={comment.authorName}
      >
        {selfieUrl ? (
          <img src={selfieUrl} alt={firstName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-sage/20 flex items-center justify-center text-xs font-serif text-sage">
            {firstName?.[0] ?? '?'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className={`inline-block rounded-2xl rounded-tl-sm px-3 py-2 max-w-full ${
          comment.authorRole === 'bride' || comment.authorRole === 'groom'
            ? 'bg-sunrise-pink/15 border border-sunrise-pink/30'
            : 'bg-sage/8 border border-sage/10'
        }`}
        style={{ background: comment.authorRole !== 'guest' ? undefined : 'rgba(138,154,134,0.06)' }}>
          <span className="font-sans font-semibold text-palmetto text-xs mr-1.5">{firstName}</span>
          {comment.authorRole !== 'guest' && (
            <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-sunrise-orange mr-1.5">
              {comment.authorRole === 'bride' ? '♡ Bride' : '♡ Groom'}
            </span>
          )}
          {editing ? (
            <div className="mt-1.5">
              <MentionInput
                value={editText}
                onChange={(v, m) => { setEditText(v); setEditMentions(m) }}
                guests={guests}
                existingMentions={editMentions}
                minRows={1}
                autoFocus
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="text-[10px] font-sans text-palmetto hover:underline"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[10px] font-sans text-sage hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <span className="font-sans text-palmetto text-sm leading-relaxed break-words">
              <RichText text={comment.content} />
            </span>
          )}
          {comment.editedAt && !editing && (
            <span className="font-sans text-[9px] text-sage/50 ml-1.5">edited</span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1 ml-1">
          <span className="font-sans text-[10px] text-sage/60">{timeAgo(comment.createdAt)}</span>
          <button
            type="button"
            onClick={handleLike}
            className={`font-sans text-[10px] transition-colors ${liked ? 'text-sunrise-orange font-semibold' : 'text-sage/60 hover:text-sage'}`}
          >
            {liked ? '♥' : '♡'} {likeCount > 0 && likeCount}
          </button>
          <button
            type="button"
            onClick={() => onReply?.(comment)}
            className="font-sans text-[10px] text-sage/60 hover:text-sage transition-colors"
          >
            Reply
          </button>
          {(isOwn || isAdmin) && (
            <>
              {isOwn && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="font-sans text-[10px] text-sage/60 hover:text-sage transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className="font-sans text-[10px] text-sage/40 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
