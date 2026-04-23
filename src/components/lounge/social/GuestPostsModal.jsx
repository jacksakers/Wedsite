import { useState, useEffect } from 'react'
import { subscribeToPostsByAuthor } from '../../../hooks/usePosts'
import { getGuestProfile } from '../../../hooks/useGuestProfiles'
import PostCard from './PostCard'
import PostCardSkeleton from './PostCardSkeleton'

/**
 * Modal showing all posts by a specific guest.
 * Opens when a guest avatar/name is clicked.
 */
export default function GuestPostsModal({
  guestId,
  guestName,
  guests,
  currentUid,
  currentGuest,
  isAdmin,
  onHashtag,
  onClose,
}) {
  const [posts, setPosts]     = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const firstName = guestName?.split(' ')[0] ?? guestName

  useEffect(() => {
    if (!guestId) return
    // Load the author's profile (for their avatar)
    getGuestProfile(guestId).then(p => setProfile(p)).catch(() => {})

    const unsub = subscribeToPostsByAuthor({
      guestId,
      includePrivate: isAdmin,
      onUpdate: (data) => { setPosts(data); setLoading(false) },
      onError: () => setLoading(false),
    })
    return unsub
  }, [guestId, isAdmin])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-palmetto/40 backdrop-blur-sm z-[200]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-paper rounded-t-2xl md:rounded-2xl z-[201] flex flex-col overflow-hidden paper-lift">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sage/15">
          <div className="flex items-center gap-3">
            {profile?.selfieUrl ? (
              <img
                src={profile.selfieUrl}
                alt={firstName}
                className="w-10 h-10 rounded-full object-cover border-2 border-sage/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center font-serif text-sage text-lg border border-sage/15">
                {firstName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h2 className="font-serif text-palmetto text-xl text-pressed">{firstName}'s posts</h2>
              {profile?.funFactText && (
                <p className="font-sans text-sage text-xs mt-0.5 line-clamp-1">{profile.funFactText}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-sage/60 hover:text-palmetto transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Posts */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {loading && (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          )}
          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="font-serif text-palmetto text-xl mb-2 text-pressed">No posts yet</p>
              <p className="font-sans text-sage text-sm">{firstName} hasn't shared anything yet.</p>
            </div>
          )}
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              profile={profile}
              guests={guests}
              currentUid={currentUid}
              currentGuest={currentGuest}
              isAdmin={isAdmin}
              onHashtag={(tag) => { onHashtag(tag); onClose() }}
              onGuestClick={() => {}}
            />
          ))}
        </div>
      </div>
    </>
  )
}
