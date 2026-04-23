import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  subscribeToPosts, subscribeToPostsByHashtag, getPostById,
} from '../../../hooks/usePosts'
import { getAllGuestProfiles } from '../../../hooks/useGuestProfiles'
import { getAllGuests } from '../../../hooks/useGuests'
import PostCard from './PostCard'
import PostCardSkeleton from './PostCardSkeleton'
import PostComposer from './PostComposer'
import GuestPostsModal from './GuestPostsModal'

const SORT_OPTIONS = [
  { value: 'active',  label: 'Most Active' },
  { value: 'recent',  label: 'Newest First' },
  { value: 'new',     label: 'New to You' },
]

const BATCH_SIZE = 8

/**
 * The main social space — lists posts, composer, filtering.
 */
export default function SocialSpace({ currentGuest, currentUser, isAdmin }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [allPosts, setAllPosts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [feedError, setFeedError]       = useState('')
  const [sort, setSort]                 = useState('active')
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const [profiles, setProfiles]         = useState({}) // guestId -> profile
  const [guests, setGuests]             = useState([])

  // Filters from URL
  const filterTag    = searchParams.get('tag')    ?? null
  const filterGuest  = searchParams.get('guestId') ?? null
  const focusPostId  = searchParams.get('post')   ?? null

  const [guestModal, setGuestModal]    = useState(null) // { guestId, guestName }
  const [composerOpen, setComposerOpen] = useState(false)
  const focusRef = useRef(null)

  // Track last visit for "New to You"
  const lastVisitKey = `lounge_last_visit_${currentUser?.uid}`
  const lastVisit    = useRef(parseInt(localStorage.getItem(lastVisitKey) ?? '0', 10))

  // Load guests + profiles once
  useEffect(() => {
    getAllGuests().then(setGuests).catch(() => {})
    getAllGuestProfiles()
      .then(list => {
        const map = {}
        list.forEach(p => { map[p.id] = p })
        setProfiles(map)
      })
      .catch(() => {})
  }, [])

  // Subscribe to posts
  useEffect(() => {
    setLoading(true)
    setFeedError('')
    let unsub

    const onErr = (err) => {
      console.error('posts subscription error:', err)
      setFeedError('Could not load posts. Please refresh.')
      setLoading(false)
    }

    if (filterTag) {
      unsub = subscribeToPostsByHashtag({
        hashtag: filterTag,
        onUpdate: (data) => { setAllPosts(data); setLoading(false) },
        onError: onErr,
      })
    } else {
      const field = sort === 'recent' ? 'recent' : 'active'
      unsub = subscribeToPosts({
        sort: field,
        includePrivate: isAdmin,
        onUpdate: (data) => { setAllPosts(data); setLoading(false) },
        onError: onErr,
      })
    }

    return () => unsub?.()
  }, [sort, filterTag, isAdmin])

  // Scroll to focused post on deep link
  useEffect(() => {
    if (!focusPostId || loading) return
    requestAnimationFrame(() => {
      document.getElementById(`post-${focusPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [focusPostId, loading])

  // Record last visit time when leaving
  useEffect(() => {
    return () => {
      localStorage.setItem(lastVisitKey, Date.now().toString())
    }
  }, [lastVisitKey])

  // Sorted + filtered posts for display
  const displayPosts = useCallback(() => {
    let posts = [...allPosts]

    // Filter guest if set
    if (filterGuest) {
      posts = posts.filter(p => p.authorGuestId === filterGuest || p.authorUid === filterGuest)
    }

    // Sort
    if (sort === 'new') {
      const last = lastVisit.current
      const newPosts  = posts.filter(p => (p.lastActivityAt?.toDate?.().getTime() ?? 0) > last)
      const oldPosts  = posts.filter(p => (p.lastActivityAt?.toDate?.().getTime() ?? 0) <= last)
      posts = [...newPosts, ...oldPosts]
    }

    return posts
  }, [allPosts, filterGuest, sort])

  const sorted  = displayPosts()
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  function handlePostSaved() {
    setComposerOpen(false)
    setVisibleCount(BATCH_SIZE)
  }

  function clearFilter() {
    setSearchParams(prev => {
      prev.delete('tag')
      prev.delete('guestId')
      prev.delete('post')
      return prev
    })
  }

  function handleHashtag(tag) {
    setSearchParams(prev => {
      prev.set('tag', tag)
      prev.delete('guestId')
      return prev
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleGuestClick(guestId, guestName) {
    setGuestModal({ guestId, guestName })
  }

  const newCount = sort === 'new'
    ? allPosts.filter(p => (p.lastActivityAt?.toDate?.().getTime() ?? 0) > lastVisit.current).length
    : 0

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6">

      {/* ── Active filter banner ── */}
      {(filterTag || filterGuest) && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-palmetto/8 border border-palmetto/20 rounded-xl">
          <span className="font-sans text-palmetto text-sm">
            {filterTag && <><span className="font-medium">#{filterTag}</span></>}
            {filterGuest && <span className="font-medium">Posts by this guest</span>}
          </span>
          <button
            type="button"
            onClick={clearFilter}
            className="font-sans text-xs text-sage hover:text-palmetto transition-colors"
          >
            Clear ✕
          </button>
        </div>
      )}

      {/* ── Composer card ── */}
      <div className="bg-paper border border-sage/15 rounded-xl paper-lift p-4 mb-5">
        {composerOpen ? (
          <PostComposer
            guests={guests}
            currentGuest={currentGuest}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onSaved={handlePostSaved}
            onCancel={() => setComposerOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="w-full text-left flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-full bg-sage/20 shrink-0 flex items-center justify-center font-serif text-sage text-base border border-sage/15">
              {currentGuest.name?.[0] ?? '?'}
            </div>
            <span className="font-sans text-sage/60 text-sm group-hover:text-sage transition-colors">
              Share something with the group…
            </span>
          </button>
        )}
      </div>

      {/* ── Sort tabs ── */}
      <div className="flex items-center gap-1 mb-5">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setSort(opt.value); setVisibleCount(BATCH_SIZE) }}
            className={`px-3 py-1.5 rounded-lg font-sans text-xs transition-colors ${
              sort === opt.value
                ? 'bg-palmetto text-paper'
                : 'text-sage hover:bg-sage/10'
            }`}
          >
            {opt.label}
            {opt.value === 'new' && newCount > 0 && (
              <span className="ml-1.5 bg-sunrise-orange text-paper rounded-full px-1.5 py-0.5 text-[9px]">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Posts ── */}
      <div className="space-y-4">
        {loading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {feedError && (
          <div className="text-center py-8">
            <p className="font-sans text-red-400 text-sm">{feedError}</p>
          </div>
        )}

        {!loading && !feedError && sorted.length === 0 && (
          <div className="text-center py-16">
            <p className="font-serif text-palmetto text-2xl mb-2 text-pressed">
              {filterTag ? `No posts for #${filterTag}` : 'Be the first to share!'}
            </p>
            <p className="font-sans text-sage text-sm">
              {filterTag
                ? 'Try a different tag or clear the filter.'
                : 'Open up the conversation — your fellow guests are waiting.'}
            </p>
          </div>
        )}

        {visible.map(post => (
          <PostCard
            key={post.id}
            post={post}
            profile={post.authorGuestId ? profiles[post.authorGuestId] : null}
            profiles={profiles}
            guests={guests}
            currentUid={currentUser.uid}
            currentGuest={currentGuest}
            isAdmin={isAdmin}
            isHighlighted={post.id === focusPostId}
            onHashtag={handleHashtag}
            onGuestClick={handleGuestClick}
          />
        ))}

        {/* Load more */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount(c => c + BATCH_SIZE)}
            className="w-full py-3 font-sans text-sm text-sage hover:text-palmetto transition-colors border border-sage/20 rounded-xl hover:border-palmetto/30"
          >
            Load more ({sorted.length - visibleCount} remaining)
          </button>
        )}
      </div>

      {/* ── Guest posts modal ── */}
      {guestModal && (
        <GuestPostsModal
          guestId={guestModal.guestId}
          guestName={guestModal.guestName}
          guests={guests}
          currentUid={currentUser.uid}
          currentGuest={currentGuest}
          isAdmin={isAdmin}
          onHashtag={handleHashtag}
          onClose={() => setGuestModal(null)}
        />
      )}
    </div>
  )
}
