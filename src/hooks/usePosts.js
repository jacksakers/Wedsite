import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, arrayUnion, arrayRemove, increment,
  writeBatch,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

export const POSTS_PAGE_SIZE = 50 // load all at once for real-time at wedding scale

// ─── Posts ────────────────────────────────────────────────────────────────────

/**
 * Subscribe to the post feed in real-time.
 * @param {{ sort: 'active'|'recent', includePrivate?: boolean, onUpdate: fn, onError?: fn }} opts
 * @returns unsubscribe fn
 */
export function subscribeToPosts({ sort = 'active', includePrivate = false, onUpdate, onError }) {
  const field = sort === 'recent' ? 'createdAt' : 'lastActivityAt'
  const constraints = [
    where('isDeleted', '==', false),
    orderBy(field, 'desc'),
    limit(POSTS_PAGE_SIZE),
  ]
  if (!includePrivate) constraints.splice(1, 0, where('isPrivate', '==', false))
  const q = query(collection(db, 'posts'), ...constraints)
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, onError ?? (() => {}))
}

/**
 * Subscribe to posts by a specific author (for guest profile modal).
 */
export function subscribeToPostsByAuthor({ guestId, includePrivate = false, onUpdate, onError }) {
  const constraints = [
    where('isDeleted', '==', false),
    where('authorGuestId', '==', guestId),
    orderBy('createdAt', 'desc'),
  ]
  if (!includePrivate) constraints.splice(1, 0, where('isPrivate', '==', false))
  const q = query(collection(db, 'posts'), ...constraints)
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, onError ?? (() => {}))
}

/** Subscribe to posts containing a hashtag. */
export function subscribeToPostsByHashtag({ hashtag, onUpdate, onError }) {
  const q = query(
    collection(db, 'posts'),
    where('isDeleted', '==', false),
    where('isPrivate', '==', false),
    where('hashtags', 'array-contains', hashtag.toLowerCase()),
    orderBy('lastActivityAt', 'desc'),
  )
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, onError ?? (() => {}))
}

/** Fetch a single post by ID (for deep links). */
export async function getPostById(postId) {
  const snap = await getDoc(doc(db, 'posts', postId))
  if (!snap.exists() || snap.data().isDeleted) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Create a new post.
 * @param {{ content, authorUid, authorGuestId, authorName, authorRole, isPrivate, photoFile, hashtags, mentions }} data
 * @param {(pct: number) => void} [onProgress]
 */
export async function createPost(
  { content, authorUid, authorGuestId, authorName, authorRole, isPrivate = false, photoFile = null, hashtags = [], mentions = [] },
  onProgress,
) {
  let photoUrl = null
  let storagePath = null
  if (photoFile) {
    const uploaded = await _uploadPostPhoto(photoFile, onProgress)
    photoUrl = uploaded.url
    storagePath = uploaded.storagePath
  }
  const now = serverTimestamp()
  const ref = await addDoc(collection(db, 'posts'), {
    content,
    authorUid,
    authorGuestId: authorGuestId ?? null,
    authorName,
    authorRole,
    isPrivate,
    photoUrl,
    storagePath,
    hashtags: hashtags.map(h => h.toLowerCase()),
    mentions,
    likes: [],
    commentCount: 0,
    isDeleted: false,
    createdAt: now,
    lastActivityAt: now,
    editedAt: null,
  })
  return ref.id
}

/**
 * Update post content (text, hashtags, mentions). Optionally replaces photo.
 */
export async function updatePost(
  postId,
  { content, hashtags, mentions, photoFile = null, removePhoto = false, existingStoragePath = null },
  onProgress,
) {
  const updates = {
    content,
    hashtags: hashtags.map(h => h.toLowerCase()),
    mentions,
    editedAt: serverTimestamp(),
  }
  if (removePhoto && existingStoragePath) {
    try { await deleteObject(ref(storage, existingStoragePath)) } catch {}
    updates.photoUrl = null
    updates.storagePath = null
  } else if (photoFile) {
    if (existingStoragePath) {
      try { await deleteObject(ref(storage, existingStoragePath)) } catch {}
    }
    const uploaded = await _uploadPostPhoto(photoFile, onProgress)
    updates.photoUrl = uploaded.url
    updates.storagePath = uploaded.storagePath
  }
  await updateDoc(doc(db, 'posts', postId), updates)
}

/** Soft-delete a post. Admins or the post owner may call this. */
export async function deletePost(postId, storagePath) {
  if (storagePath) {
    try { await deleteObject(ref(storage, storagePath)) } catch {}
  }
  await updateDoc(doc(db, 'posts', postId), { isDeleted: true })
}

/**
 * Toggle like on a post. Returns { liked: boolean }.
 */
export async function togglePostLike(postId, uid) {
  const postRef = doc(db, 'posts', postId)
  const snap = await getDoc(postRef)
  if (!snap.exists()) return { liked: false }
  const alreadyLiked = (snap.data().likes ?? []).includes(uid)
  await updateDoc(postRef, {
    likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid),
    lastActivityAt: serverTimestamp(),
  })
  return { liked: !alreadyLiked, wasFirst: !alreadyLiked }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Subscribe to comments for a post (flat list, ordered by time). */
export function subscribeToComments({ postId, onUpdate, onError }) {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, onError ?? (() => {}))
}

/** Add a comment to a post. Returns the new comment ID. */
export async function addComment({ postId, content, authorUid, authorGuestId, authorName, authorRole, parentCommentId = null, mentions = [] }) {
  const batch = writeBatch(db)
  const commentRef = doc(collection(db, 'posts', postId, 'comments'))
  batch.set(commentRef, {
    content,
    authorUid,
    authorGuestId: authorGuestId ?? null,
    authorName,
    authorRole,
    parentCommentId,
    mentions,
    likes: [],
    isDeleted: false,
    createdAt: serverTimestamp(),
    editedAt: null,
  })
  batch.update(doc(db, 'posts', postId), {
    commentCount: increment(1),
    lastActivityAt: serverTimestamp(),
  })
  await batch.commit()
  return commentRef.id
}

/** Edit a comment's content. */
export async function editComment(postId, commentId, { content, mentions }) {
  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    content,
    mentions,
    editedAt: serverTimestamp(),
  })
}

/** Soft-delete a comment. */
export async function deleteComment(postId, commentId) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'posts', postId, 'comments', commentId), { isDeleted: true })
  batch.update(doc(db, 'posts', postId), { commentCount: increment(-1) })
  await batch.commit()
}

/** Toggle like on a comment. Returns { liked: boolean }. */
export async function toggleCommentLike(postId, commentId, uid) {
  const ref = doc(db, 'posts', postId, 'comments', commentId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return { liked: false }
  const alreadyLiked = (snap.data().likes ?? []).includes(uid)
  await updateDoc(ref, { likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid) })
  return { liked: !alreadyLiked }
}

// ─── Text Parsing Helpers ──────────────────────────────────────────────────────

/** Extract hashtags from text. Returns lowercase strings without #. */
export function parseHashtags(text) {
  return [...(text ?? '').matchAll(/#([a-zA-Z0-9_]+)/g)].map(m => m[1].toLowerCase())
}

/** Extract @mention display names from text. Returns names without @. */
export function parseMentionNames(text) {
  return [...(text ?? '').matchAll(/@([\w]+)/g)].map(m => m[1])
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function _uploadPostPhoto(file, onProgress) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const path = `postPhotos/${filename}`
  const storageRef = ref(storage, path)
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap => onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({ url, storagePath: path })
        } catch (err) { reject(err) }
      },
    )
  })
}
