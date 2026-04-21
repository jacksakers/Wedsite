import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const PROFILES_DOC = doc(db, 'config', 'coupleProfiles')

/**
 * Returns the couple profile for the given UID, or null if not set.
 * Shape: { name: string, role: 'bride' | 'groom' }
 */
export async function getCoupleProfile(uid) {
  const snap = await getDoc(PROFILES_DOC)
  if (!snap.exists()) return null
  return snap.data()[uid] ?? null
}

/**
 * Saves (or overwrites) the couple profile for the given UID.
 */
export async function setCoupleProfile(uid, { name, role }) {
  await setDoc(PROFILES_DOC, { [uid]: { name, role } }, { merge: true })
}
