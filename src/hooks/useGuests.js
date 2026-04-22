import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export async function getAllGuests() {
  const snap = await getDocs(collection(db, 'guests'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * data shape: { name: string, party: [{ name: string }] }
 * nameLower is derived automatically for case-insensitive RSVP lookup.
 */
export async function addGuest(data) {
  await addDoc(collection(db, 'guests'), {
    ...data,
    nameLower: data.name.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  })
}

export async function updateGuest(id, data) {
  await updateDoc(doc(db, 'guests', id), {
    ...data,
    nameLower: data.name.trim().toLowerCase(),
  })
}

export async function deleteGuest(id) {
  await deleteDoc(doc(db, 'guests', id))
}

/**
 * Links an anonymous UID to a guest document.
 * Also used for re-linking (multi-device): the Firestore rule allows
 * overwriting `linkedUid` when the new value is the caller's own UID.
 */
export async function linkGuestUid(guestId, uid) {
  await updateDoc(doc(db, 'guests', guestId), { linkedUid: uid })
}

/**
 * Removes the linkedUid from a guest document (admin only).
 * Allows a guest to re-claim their identity from scratch on any device.
 */
export async function resetGuestUid(guestId) {
  await updateDoc(doc(db, 'guests', guestId), { linkedUid: null })
}

/**
 * Returns the guest document linked to a given Firebase Auth UID, or null.
 */
export async function getGuestByUid(uid) {
  const snap = await getDocs(query(collection(db, 'guests'), where('linkedUid', '==', uid)))
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}
