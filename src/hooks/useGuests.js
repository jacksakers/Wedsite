import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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
