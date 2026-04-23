import { useState, useRef, useCallback } from 'react'
import { deletePost, togglePostLike, parseHashtags } from '../../../hooks/usePosts'
import { notifyPostLike } from '../../../hooks/useNotifications'
import { RichText, timeAgo } from '../../../utils/richText'
import PostComposer from './PostComposer'
import CommentThread from './CommentThread'

/**
 * A single post card with likes, comments, share, edit, delete.
 *
 * @param {{
 *   post: object,
 *   profile: object|null,       // author's guestProfile (selfie, etc.)
 *   guests: object[],
 *   currentUid: string,
 *   currentGuest: object,
 *   isAdmin: boolean,
 *   isHighlighted?: boolean,    // for deep-link highlight
 *   onHashtag: (tag: string) => void,
 *   onGuestClick: (guestId: string, name: string) => void,
 * }}
 */
export default function PostCard({
  post,
  profile,
  guests,
  currentUid,
  currentGuest,
  isAdmin,
  isHighlighted = false,
  onHashtag,
  onGuestClick,
}) {
  const [likeCount, setLikeCount]     = useState(post.likes?.length ?? 0)
  const [liked, setLiked]             = useState((post.likes ?? []).includes(currentUid))
  const [likeAnim, setLikeAnim]       = useState(false)
  const [showComments, setShowComments] = useState(isHighlighted)
  const [editing, setEditing]         = useState(false)
  const [showMenu, setShowMenu]       = useState(false)
  const [deleted, setDeleted]         = useState(false)
  const [sharing, setSharing]         = useState(false)

  const lastTap = useRef(0)
  const menuRef = useRef(null)

  const isOwn     = post.authorUid === currentUid
  const isCouple  = post.authorRole === 'bride' || post.authorRole === 'groom'
  const firstName = post.authorName?.split(' ')[0] ?? post.authorName

  const photoUrl = profile?.selfieUrl ?? null
  const commentCount = post.commentCount ?? 0

  // Determine if this post has recent activity (last 24h) for "boosted" indicator
  const lastActivityMs = post.lastActivityAt?.toDate?.().getTime() ?? 0
  const createdMs      = post.createdAt?.toDate?.().getTime() ?? 0
  const isBoosted = (Date.now() - lastActivityMs < 86400000) && (lastActivityMs > createdMs + 60000)

  if (deleted) return null

  // ── Like ────────────────────────────────────────────────────────────────────

  async function handleLike() {
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => prev ? c - 1 : c + 1)
    if (!prev) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600) }
    try {
      const { liked: nowLiked, wasFirst } = await togglePostLike(post.id, currentUid)
      if (wasFirst && !prev) {
        await notifyPostLike({
          post,
          actorName: currentGuest.name,
          actorUid: currentUid,
          actorGuestId: currentGuest.isCouple ? null : currentGuest.id,
          wasFirst: true,
        })
      }
    } catch {
      setLiked(prev)
      setLikeCount(c => prev ? c + 1 : c - 1)
    }
  }

  // Double-tap to like
  function handleTap() {
    const now = Date.now()
    if (now - lastTap.current < 300) handleLike()
    lastTap.current = now
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setShowMenu(false)
    if (!window.confirm('Delete this post?')) return
    setDeleted(true)
    await deletePost(post.id, post.storagePath)
  }

  // ── Share ───────────────────────────────────────────────────────────────────

  async function handleShare() {
    const url = `${window.location.origin}/lounge?tab=social&post=${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      setSharing(true)
      setTimeout(() => setSharing(false), 1800)
    } catch {
      // Fallback: select the URL
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <div className={`bg-paper border rounded-xl paper-lift p-4 transition-all ${
        isCouple ? 'border-sunrise-pink/40 bg-sunrise-pink/5' : 'border-sage/15'
      }`}>
        <PostComposer
          guests={guests}
          currentGuest={currentGuest}
          currentUser={{ uid: currentUid }}
          isAdmin={isAdmin}
          editingPost={post}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <article
      id={`post-${post.id}`}
      className={`bg-paper border rounded-xl paper-lift overflow-hidden transition-all ${
        isCouple
          ? 'border-sunrise-pink/40 bg-sunrise-pink/5'
          : isHighlighted
          ? 'border-palmetto/40 ring-2 ring-palmetto/20'
          : 'border-sage/15'
      }`}
      onTouchEnd={handleTap}
    >
      {/* ── Couple ribbon ── */}
      {isCouple && (
        <div className="bg-gradient-to-r from-sunrise-pink/20 via-sunrise-orange/10 to-sunrise-pink/20 px-4 py-1.5 border-b border-sunrise-pink/20 flex items-center gap-2">
          <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-sunrise-orange/80">
            ~ A message from {post.authorRole === 'bride' ? 'The Bride' : 'The Groom'}
          </span>
        </div>
      )}

      {/* ── Private banner ── */}
      {post.isPrivate && (
        <div className="bg-sunrise-orange/8 px-4 py-1.5 border-b border-sunrise-orange/15 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-sunrise-orange/70" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-sunrise-orange/70">
            Private — just for the couple
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        {/* Author info */}
        <button
          type="button"
          onClick={() => post.authorGuestId && onGuestClick?.(post.authorGuestId, post.authorName)}
          className="flex items-center gap-3 text-left group"
          disabled={!post.authorGuestId}
        >
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full shrink-0 overflow-hidden border-2 transition-all group-hover:ring-2 ${
            isCouple ? 'border-sunrise-pink/50 group-hover:ring-sunrise-pink/30' : 'border-sage/20 group-hover:ring-sage/30'
          }`}>
            {photoUrl ? (
              <img src={photoUrl} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sage/15 flex items-center justify-center font-serif text-sage text-lg">
                {firstName?.[0] ?? '?'}
              </div>
            )}
          </div>

          {/* Name + timestamp */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans font-semibold text-palmetto text-sm leading-tight">{firstName}</span>
              {isCouple && (
                <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-sunrise-orange bg-sunrise-orange/10 px-1.5 py-0.5 rounded-full">
                  {post.authorRole === 'bride' ? 'Bride' : 'Groom'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-sans text-[11px] text-sage/60">{timeAgo(post.createdAt)}</span>
              {post.editedAt && (
                <span className="font-sans text-[9px] text-sage/40">· edited</span>
              )}
              {isBoosted && (
                <span className="font-sans text-[9px] text-sunrise-orange/70 bg-sunrise-orange/8 px-1.5 py-0.5 rounded-full">
                  💬 new activity
                </span>
              )}
            </div>
          </div>
        </button>

        {/* More menu */}
        {(isOwn || isAdmin) && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(m => !m)}
              className="p-1.5 rounded-full text-sage/50 hover:text-sage hover:bg-sage/10 transition-colors"
              aria-label="Post options"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-paper border border-sage/20 rounded-lg shadow-lg z-20 min-w-[120px] overflow-hidden">
                {isOwn && (
                  <button
                    type="button"
                    onClick={() => { setShowMenu(false); setEditing(true) }}
                    className="w-full text-left px-4 py-2.5 font-sans text-sm text-palmetto hover:bg-sage/10 transition-colors"
                  >
                    Edit post
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2.5 font-sans text-sm text-red-400 hover:bg-red-50 transition-colors"
                >
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div
        className="px-4 pt-1 pb-3 cursor-pointer"
        onDoubleClick={handleLike}
        onClick={() => { if (showMenu) setShowMenu(false) }}
      >
        {post.content && (
          <p className="font-sans text-palmetto text-sm leading-relaxed whitespace-pre-wrap">
            <RichText
              text={post.content}
              onHashtag={onHashtag}
              onMention={(name) => {
                const m = post.mentions?.find(x => x.name?.split(' ')[0] === name)
                if (m?.uid) onGuestClick?.(m.uid, m.name)
              }}
            />
          </p>
        )}

        {/* Photo */}
        {post.photoUrl && (
          <div className="mt-3 rounded-lg overflow-hidden border border-sage/10">
            <img
              src={post.photoUrl}
              alt="Post image"
              className="w-full object-cover max-h-96"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* ── Actions bar ── */}
      <div className="flex items-center gap-4 px-4 pb-3 border-t border-sage/8 pt-2">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-all select-none ${
            liked ? 'text-sunrise-orange' : 'text-sage/60 hover:text-sunrise-orange'
          }`}
        >
          <span
            className={`text-lg leading-none transition-transform ${likeAnim ? 'scale-150' : 'scale-100'}`}
            style={{ transition: likeAnim ? 'transform 0.15s ease-out' : 'transform 0.3s ease-in' }}
          >
            {liked ? '♥' : '♡'}
          </span>
          <span className="font-sans text-xs">{likeCount > 0 ? likeCount : ''}</span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 text-sage/60 hover:text-palmetto transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-sans text-xs">{commentCount > 0 ? commentCount : ''}</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sage/60 hover:text-palmetto transition-colors ml-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="font-sans text-xs">{sharing ? 'Copied!' : ''}</span>
        </button>
      </div>

      {/* ── Comment thread ── */}
      {showComments && (
        <div className="px-4 pb-4">
          <CommentThread
            post={post}
            guests={guests}
            currentUid={currentUid}
            currentGuest={currentGuest}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </article>
  )
}
