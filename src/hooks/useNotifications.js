import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

const NOTIF_LIMIT = 40

// ─── Subscribe ────────────────────────────────────────────────────────────────

/** Real-time listener for a user's notifications. Returns unsubscribe fn. */
export function subscribeToNotifications({ uid, onUpdate, onError }) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(NOTIF_LIMIT),
  )
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, onError ?? (() => {}))
}

// ─── Writes ───────────────────────────────────────────────────────────────────

/** Mark a single notification as read. */
export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true })
}

/** Mark all of a user's notifications as read. */
export async function markAllNotificationsRead(uid) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    where('read', '==', false),
  )
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.update(d.ref, { read: true }))
  await batch.commit()
}

/**
 * Create a notification. Silently skips if actor == recipient.
 *
 * @param {{
 *   recipientUid: string,
 *   type: 'like_post'|'comment'|'reply'|'mention_post'|'mention_comment',
 *   actorName: string,
 *   actorUid: string,
 *   actorGuestId?: string|null,
 *   postId: string,
 *   commentId?: string|null,
 *   postSnippet?: string,
 * }} params
 */
export async function createNotification({
  recipientUid, type, actorName, actorUid, actorGuestId = null,
  postId, commentId = null, postSnippet = '',
}) {
  if (!recipientUid || recipientUid === actorUid) return
  await addDoc(collection(db, 'notifications'), {
    recipientUid,
    type,
    actorName,
    actorUid,
    actorGuestId,
    postId,
    commentId,
    postSnippet: (postSnippet ?? '').slice(0, 80),
    read: false,
    createdAt: serverTimestamp(),
  })
}

/**
 * Convenience: notify the post author when someone likes their post.
 * Only fires on first like (wasFirst flag from togglePostLike).
 */
export async function notifyPostLike({ post, actorName, actorUid, actorGuestId, wasFirst }) {
  if (!wasFirst) return
  await createNotification({
    recipientUid: post.authorUid,
    type: 'like_post',
    actorName,
    actorUid,
    actorGuestId,
    postId: post.id,
    postSnippet: post.content,
  })
}

/**
 * Convenience: notify the post author + mentioned users when a comment is added.
 */
export async function notifyComment({ post, commentId, actorName, actorUid, actorGuestId, mentions = [] }) {
  const recipients = new Set()

  // Notify post author
  if (post.authorUid !== actorUid) {
    recipients.add(post.authorUid)
    await createNotification({
      recipientUid: post.authorUid,
      type: 'comment',
      actorName, actorUid, actorGuestId,
      postId: post.id,
      commentId,
      postSnippet: post.content,
    })
  }

  // Notify mentioned users
  for (const m of mentions) {
    if (!m.uid || recipients.has(m.uid) || m.uid === actorUid) continue
    recipients.add(m.uid)
    await createNotification({
      recipientUid: m.uid,
      type: 'mention_comment',
      actorName, actorUid, actorGuestId,
      postId: post.id,
      commentId,
      postSnippet: post.content,
    })
  }
}

/**
 * Convenience: notify a comment's author when someone replies to them.
 */
export async function notifyReply({ post, commentAuthorUid, commentId, actorName, actorUid, actorGuestId, mentions = [] }) {
  const recipients = new Set()

  if (commentAuthorUid && commentAuthorUid !== actorUid) {
    recipients.add(commentAuthorUid)
    await createNotification({
      recipientUid: commentAuthorUid,
      type: 'reply',
      actorName, actorUid, actorGuestId,
      postId: post.id,
      commentId,
      postSnippet: post.content,
    })
  }

  for (const m of mentions) {
    if (!m.uid || recipients.has(m.uid) || m.uid === actorUid) continue
    recipients.add(m.uid)
    await createNotification({
      recipientUid: m.uid,
      type: 'mention_comment',
      actorName, actorUid, actorGuestId,
      postId: post.id,
      commentId,
      postSnippet: post.content,
    })
  }
}

// ─── Notification Display Helpers ─────────────────────────────────────────────

const NOTIF_LABELS = {
  like_post:       (n) => `${n.actorName} liked your post`,
  comment:         (n) => `${n.actorName} commented on your post`,
  reply:           (n) => `${n.actorName} replied to your comment`,
  mention_post:    (n) => `${n.actorName} mentioned you in a post`,
  mention_comment: (n) => `${n.actorName} mentioned you in a comment`,
}

export function getNotificationLabel(notification) {
  return NOTIF_LABELS[notification.type]?.(notification) ?? 'New activity'
}
