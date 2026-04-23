import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot,
  serverTimestamp, arrayUnion, arrayRemove, increment,
  writeBatch, limit,
} from 'firebase/firestore'
import { db } from '../firebase'

export const VIBE_OPTIONS = [
  { value: 'slow_dance', label: '🕯 Slow Dance' },
  { value: 'energetic',  label: '🔥 Energetic' },
  { value: 'romantic',   label: '💕 Romantic' },
  { value: 'feel_good',  label: '😊 Feel-Good' },
  { value: 'line_dance', label: '🤠 Line Dance' },
  { value: 'party',      label: '🎉 Party Anthem' },
  { value: 'other',      label: '✨ Other' },
]

// ─── Subscriptions ────────────────────────────────────────────────────────────

/** Real-time listener for all active songs, sorted by score desc then oldest first. */
export function subscribeToMixtape({ onUpdate, onError }) {
  const q = query(
    collection(db, 'mixtape'),
    where('isDeleted', '==', false),
    orderBy('score', 'desc'),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(
    q,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => {
      console.error('[useMixtape] subscribeToMixtape error:', err)
      onError?.(err)
    },
  )
}

// ─── Song CRUD ────────────────────────────────────────────────────────────────

/**
 * Add a new song to the mixtape.
 * If the same title+artist already exists (case-insensitive), auto-upvotes it
 * instead of creating a duplicate.
 * Returns { id: string, wasUpvote: boolean, alreadyVoted?: boolean }
 */
export async function addSong({
  songTitle, artist, note = '', vibe = '',
  requestedByUid, requestedByGuestId = null, requestedByName,
  requestedByRole = 'guest',
}) {
  const titleLower  = songTitle.trim().toLowerCase()
  const artistLower = artist.trim().toLowerCase()

  // Duplicate check
  const dupSnap = await getDocs(
    query(
      collection(db, 'mixtape'),
      where('songTitleLower', '==', titleLower),
      where('artistLower',   '==', artistLower),
      where('isDeleted',     '==', false),
    ),
  )

  if (!dupSnap.empty) {
    const existing     = dupSnap.docs[0]
    const alreadyVoted = (existing.data().upvotes ?? []).includes(requestedByUid)
    if (!alreadyVoted) {
      const isCouple = requestedByRole === 'bride' || requestedByRole === 'groom'
      const delta    = isCouple ? 2 : 1
      const updates  = {
        upvotes:     arrayUnion(requestedByUid),
        upvoteCount: increment(1),
        score:       increment(delta),
      }
      if (isCouple) {
        updates.coupleUpvotes = arrayUnion(requestedByUid)
        if (requestedByRole === 'bride') updates.brideVoted = true
        if (requestedByRole === 'groom') updates.groomVoted = true
      }
      await updateDoc(existing.ref, updates)
    }
    return { id: existing.id, wasUpvote: true, alreadyVoted }
  }

  // New song
  const isCouple = requestedByRole === 'bride' || requestedByRole === 'groom'
  const docRef   = await addDoc(collection(db, 'mixtape'), {
    songTitle:          songTitle.trim(),
    songTitleLower:     titleLower,
    artist:             artist.trim(),
    artistLower,
    note:               note.trim(),
    vibe,
    requestedByUid,
    requestedByGuestId: requestedByGuestId ?? null,
    requestedByName,
    requestedByRole,
    upvotes:            [requestedByUid],
    coupleUpvotes:      isCouple ? [requestedByUid] : [],
    upvoteCount:        1,
    score:              isCouple ? 2 : 1,
    brideVoted:         requestedByRole === 'bride',
    groomVoted:         requestedByRole === 'groom',
    commentCount:       0,
    isDeleted:          false,
    createdAt:          serverTimestamp(),
  })
  return { id: docRef.id, wasUpvote: false }
}

/**
 * Toggle an upvote on a song.
 * coupleRole: 'bride' | 'groom' | null (null for regular guests)
 * Couple votes count double in the score to give them special weight.
 * Returns { upvoted: boolean, wasFirst: boolean }
 */
export async function toggleSongUpvote(songId, uid, coupleRole = null) {
  const songRef        = doc(db, 'mixtape', songId)
  const snap           = await getDoc(songRef)
  if (!snap.exists())  return { upvoted: false }

  const data           = snap.data()
  const alreadyUpvoted = (data.upvotes ?? []).includes(uid)
  const isCouple       = coupleRole === 'bride' || coupleRole === 'groom'
  const delta          = isCouple ? 2 : 1

  const updates = {
    upvotes:     alreadyUpvoted ? arrayRemove(uid) : arrayUnion(uid),
    upvoteCount: increment(alreadyUpvoted ? -1 : 1),
    score:       increment(alreadyUpvoted ? -delta : delta),
  }

  if (isCouple) {
    updates.coupleUpvotes = alreadyUpvoted ? arrayRemove(uid) : arrayUnion(uid)
    if (coupleRole === 'bride') updates.brideVoted = !alreadyUpvoted
    if (coupleRole === 'groom') updates.groomVoted = !alreadyUpvoted
  }

  await updateDoc(songRef, updates)
  return { upvoted: !alreadyUpvoted, wasFirst: !alreadyUpvoted }
}

/** Soft-delete a song (author or admin only). */
export async function deleteSong(songId) {
  await updateDoc(doc(db, 'mixtape', songId), { isDeleted: true })
}

// ─── Album Art (iTunes Search API — free, no auth, browser-safe CORS) ────────

/**
 * Fetch album art via the iTunes Search API.
 * Returns a ~600×600 image URL or null if not found.
 * Apple allows up to ~20 req/min from browsers — fine for our scale.
 */
export async function fetchAlbumArt(artist, title) {
  try {
    const term = encodeURIComponent(`${title} ${artist}`)
    const res  = await fetch(
      `https://itunes.apple.com/search?term=${term}&limit=1&entity=song&media=music`,
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.results?.[0]
    if (!item?.artworkUrl100) return null
    return item.artworkUrl100.replace('100x100bb', '600x600bb')
  } catch {
    return null
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Subscribe to flat comments for a song. Returns unsubscribe fn. */
export function subscribeToSongComments({ songId, onUpdate, onError }) {
  const q = query(
    collection(db, 'mixtape', songId, 'comments'),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(
    q,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError ?? (() => {}),
  )
}

/** Add a comment. Returns new comment ID. */
export async function addSongComment({
  songId, content, authorUid, authorGuestId, authorName, authorRole,
}) {
  const batch      = writeBatch(db)
  const commentRef = doc(collection(db, 'mixtape', songId, 'comments'))
  batch.set(commentRef, {
    content,
    authorUid,
    authorGuestId: authorGuestId ?? null,
    authorName,
    authorRole,
    likes:     [],
    isDeleted: false,
    createdAt: serverTimestamp(),
    editedAt:  null,
  })
  batch.update(doc(db, 'mixtape', songId), { commentCount: increment(1) })
  await batch.commit()
  return commentRef.id
}

/** Edit a comment's content. */
export async function editSongComment(songId, commentId, content) {
  await updateDoc(doc(db, 'mixtape', songId, 'comments', commentId), {
    content,
    editedAt: serverTimestamp(),
  })
}

/** Soft-delete a comment. */
export async function deleteSongComment(songId, commentId) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'mixtape', songId, 'comments', commentId), { isDeleted: true })
  batch.update(doc(db, 'mixtape', songId), { commentCount: increment(-1) })
  await batch.commit()
}

/** Toggle like on a comment. */
export async function toggleSongCommentLike(songId, commentId, uid) {
  const ref          = doc(db, 'mixtape', songId, 'comments', commentId)
  const snap         = await getDoc(ref)
  if (!snap.exists()) return { liked: false }
  const alreadyLiked = (snap.data().likes ?? []).includes(uid)
  await updateDoc(ref, { likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid) })
  return { liked: !alreadyLiked }
}

// ─── Export ────────────────────────────────────────────────────────────────────

/** Fetch the top N songs by score for the admin export modal. */
export async function getTopSongs(n = 20) {
  const q = query(
    collection(db, 'mixtape'),
    where('isDeleted', '==', false),
    orderBy('score', 'desc'),
    limit(n),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
