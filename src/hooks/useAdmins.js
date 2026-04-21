import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Fetches the list of admin UIDs from Firestore (config/admins).
 * Always includes VITE_ADMIN_UID as a superadmin fallback so the primary
 * owner can never be locked out.
 */
export async function getAdminUids() {
  const snap = await getDoc(doc(db, 'config', 'admins'))
  const envUid = import.meta.env.VITE_ADMIN_UID
  if (!snap.exists()) return envUid ? [envUid] : []
  const uids = snap.data().uids ?? []
  if (envUid && !uids.includes(envUid)) return [...uids, envUid]
  return uids
}

export async function addAdminUid(uid) {
  await setDoc(doc(db, 'config', 'admins'), { uids: arrayUnion(uid) }, { merge: true })
}

export async function removeAdminUid(uid) {
  await setDoc(doc(db, 'config', 'admins'), { uids: arrayRemove(uid) }, { merge: true })
}
