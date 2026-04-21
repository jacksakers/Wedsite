import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

const ADMINS_DOC = doc(db, 'config', 'admins')

/**
 * Fetches the list of admin UIDs from Firestore (config/admins).
 * If the document doesn't exist yet, seeds it with VITE_ADMIN_UID so no
 * manual Firebase Console setup is required.
 * VITE_ADMIN_UID is always included as a superadmin fallback so the primary
 * owner can never be locked out.
 */
export async function getAdminUids() {
  const envUid = import.meta.env.VITE_ADMIN_UID
  const snap = await getDoc(ADMINS_DOC)

  if (!snap.exists()) {
    if (envUid) {
      try {
        // Seed the document so the Admins tab and Firestore rules work.
        // Wrapped in try/catch: the first login attempt may hit a permissions
        // error if the rule hasn't matched yet (bootstrap race). We still
        // return the env UID so the admin gets through regardless.
        await setDoc(ADMINS_DOC, { uids: [envUid] })
      } catch {
        // Seeding failed (e.g. rules not yet propagated). Non-fatal —
        // the env UID below is still returned as the authoritative fallback.
      }
    }
    return envUid ? [envUid] : []
  }

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
