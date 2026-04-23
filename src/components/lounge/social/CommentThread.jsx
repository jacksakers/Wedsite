import { useState, useEffect, useRef } from 'react'
import { subscribeToComments, addComment, parseHashtags } from '../../../hooks/usePosts'
import { notifyComment, notifyReply } from '../../../hooks/useNotifications'
import MentionInput from './MentionInput'
import CommentItem from './CommentItem'

/**
 * Full comment thread for a post, with nested replies.
 */
export default function CommentThread({ post, guests, currentUid, currentGuest, isAdmin }) {
  const [comments, setComments]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [replyTo, setReplyTo]         = useState(null) // comment object | null
  const [text, setText]               = useState('')
  const [mentions, setMentions]       = useState([])
  const [submitting, setSubmitting]   = useState(false)
  const [showAll, setShowAll]         = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeToComments({
      postId: post.id,
      onUpdate: setComments,
      onError: () => setLoading(false),
    })
    setLoading(false)
    return unsub
  }, [post.id])

  // Split into top-level comments and replies
  const topLevel = comments.filter(c => !c.parentCommentId)
  const replies  = comments.filter(c =>  c.parentCommentId)
  const visibleTop = showAll ? topLevel : topLevel.slice(0, 3)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const commentId = await addComment({
        postId: post.id,
        content: text.trim(),
        authorUid: currentUid,
        authorGuestId: currentGuest.isCouple ? null : currentGuest.id,
        authorName: currentGuest.name,
        authorRole: currentGuest.isCouple ? currentGuest.role : 'guest',
        parentCommentId: replyTo?.id ?? null,
        mentions,
      })

      // Fire notifications
      if (replyTo) {
        await notifyReply({
          post,
          commentAuthorUid: replyTo.authorUid,
          commentId,
          actorName: currentGuest.name,
          actorUid: currentUid,
          actorGuestId: currentGuest.isCouple ? null : currentGuest.id,
          mentions,
        })
      } else {
        await notifyComment({
          post,
          commentId,
          actorName: currentGuest.name,
          actorUid: currentUid,
          actorGuestId: currentGuest.isCouple ? null : currentGuest.id,
          mentions,
        })
      }

      setText('')
      setMentions([])
      setReplyTo(null)
      setShowAll(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleReply(comment) {
    const firstName = comment.authorName?.split(' ')[0] ?? ''
    setReplyTo(comment)
    setText(`@${firstName} `)
    setMentions([{ uid: comment.authorUid, name: comment.authorName }])
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="border-t border-sage/10 pt-3 mt-1">
      {loading && (
        <p className="font-sans text-[11px] text-sage/50 px-1 py-2">Loading…</p>
      )}

      {/* Comment list */}
      <div>
        {visibleTop.map(comment => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              post={post}
              guests={guests}
              currentUid={currentUid}
              currentGuest={currentGuest}
              isAdmin={isAdmin}
              onReply={handleReply}
            />
            {/* Replies */}
            {replies.filter(r => r.parentCommentId === comment.id).map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                post={post}
                guests={guests}
                currentUid={currentUid}
                currentGuest={currentGuest}
                isAdmin={isAdmin}
                indent
                onReply={handleReply}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {topLevel.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(s => !s)}
          className="mt-2 ml-1 font-sans text-xs text-sage/70 hover:text-sage transition-colors"
        >
          {showAll ? 'Show less' : `View ${topLevel.length - 3} more comment${topLevel.length - 3 !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Reply-to banner */}
      {replyTo && (
        <div className="flex items-center gap-2 mt-3 px-2 py-1.5 bg-sage/8 rounded-lg border border-sage/15">
          <span className="font-sans text-xs text-sage flex-1 truncate">
            Replying to <strong className="text-palmetto">{replyTo.authorName?.split(' ')[0]}</strong>
          </span>
          <button
            type="button"
            onClick={() => { setReplyTo(null); setText(''); setMentions([]) }}
            className="text-sage/60 hover:text-sage text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Compose */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-3 items-end">
        <div className="w-7 h-7 rounded-full bg-sage/20 shrink-0 flex items-center justify-center text-xs font-serif text-sage border border-sage/10">
          {currentGuest.name?.[0] ?? '?'}
        </div>
        <div className="flex-1">
          <MentionInput
            value={text}
            onChange={(v, m) => { setText(v); setMentions(m) }}
            guests={guests}
            existingMentions={mentions}
            placeholder={replyTo ? `Reply to ${replyTo.authorName?.split(' ')[0]}…` : 'Add a comment…'}
            minRows={1}
            maxLength={500}
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="mb-1 px-3 py-2 bg-palmetto text-paper text-xs font-sans rounded-lg hover:bg-palmetto/80 transition-colors disabled:opacity-40 shrink-0"
        >
          {submitting ? '…' : '→'}
        </button>
      </form>
    </div>
  )
}
