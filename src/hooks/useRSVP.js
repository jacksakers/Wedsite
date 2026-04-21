import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Looks up a guest in Firestore by their name.
 *
 * Expected /guests document shape:
 *   { name: "Jane Smith", nameLower: "jane smith", party: [{ name: "Jane Smith" }, ...] }
 *
 * To add guests, use Firebase Console → Firestore → guests collection.
 * Make sure to include the `nameLower` field (all-lowercase version of the guest's name).
 */
export async function lookupGuest(name) {
  const normalized = name.trim().toLowerCase()
  const q = query(collection(db, 'guests'), where('nameLower', '==', normalized))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

/**
 * Writes (or overwrites) an RSVP to /rsvps/{guestId}.
 * Using setDoc with the guest ID as the key allows guests to update their RSVP.
 */
export async function submitRSVP(guestId, data) {
  await setDoc(doc(db, 'rsvps', guestId), {
    ...data,
    submittedAt: serverTimestamp(),
  })
}
