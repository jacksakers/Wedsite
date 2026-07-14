import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Looks up a guest in Firestore by their name.
 *
 * Expected /guests document shape:
 *   {
 *     name: "Jane Smith",
 *     nameLower: "jane smith",
 *     groupId: "abc123",
 *     party: [{ guestId: "abc123", name: "Jane Smith" }, ...],
 *   }
 */
export async function lookupGuest(name) {
  const normalized = name.trim().toLowerCase()
  const q = query(collection(db, 'guests'), where('nameLower', '==', normalized))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function getGroupRSVPs(groupId) {
  const q = query(collection(db, 'rsvps'), where('groupId', '==', groupId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Writes (or overwrites) an individual RSVP to /rsvps/{guestId}.
 */
export async function submitRSVP(guestId, data) {
  await setDoc(doc(db, 'rsvps', guestId), {
    ...data,
    submittedAt: serverTimestamp(),
  })
}
