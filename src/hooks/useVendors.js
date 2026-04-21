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

export async function getAllVendors() {
  const snap = await getDocs(collection(db, 'vendors'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addVendor(data) {
  await addDoc(collection(db, 'vendors'), { ...data, createdAt: serverTimestamp() })
}

export async function updateVendor(id, data) {
  // Strip id and createdAt so they aren't written back
  const { id: _id, createdAt: _ts, ...rest } = data
  await updateDoc(doc(db, 'vendors', id), rest)
}

export async function deleteVendor(id) {
  await deleteDoc(doc(db, 'vendors', id))
}
