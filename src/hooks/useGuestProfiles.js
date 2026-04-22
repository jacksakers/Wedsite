import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

export const FUN_FACT_PROMPTS = [
  { key: 'know_couple',  label: 'How I know the couple',          placeholder: 'We met at…' },
  { key: 'karaoke',      label: 'My go-to karaoke song',          placeholder: 'Something classic, obviously…' },
  { key: 'find_me',      label: 'You can always find me…',        placeholder: 'At the nearest coffee shop…' },
  { key: 'hot_take',     label: 'My spiciest hot take',           placeholder: "Don't @ me, but…" },
  { key: 'bucket_list',  label: 'One thing on my bucket list',    placeholder: 'Someday I will…' },
  { key: 'advice',       label: 'My advice for the happy couple', placeholder: 'The secret to a happy marriage is…' },
]

/** Returns a single guest profile document, or null if not found. */
export async function getGuestProfile(guestId) {
  const snap = await getDoc(doc(db, 'guestProfiles', guestId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/** Returns all guest profiles ordered by most recently updated. */
export async function getAllGuestProfiles() {
  const snap = await getDocs(
    query(collection(db, 'guestProfiles'), orderBy('updatedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Creates or overwrites a guest profile.
 * Pass `selfieFile` to upload a new photo; pass null to keep the existing one.
 * Pass `existingSelfieStoragePath` so the old file can be cleaned up on replace.
 *
 * @param {string} guestId
 * @param {{ selfieFile: File|null, existingSelfieUrl: string|null, existingSelfieStoragePath: string|null, promptKey: string, funFactText: string, guestName: string, isCouple?: boolean, coupleRole?: string }} params
 * @param {(pct: number) => void} [onProgress]
 */
export async function saveGuestProfile(
  guestId,
  { selfieFile, existingSelfieUrl, existingSelfieStoragePath, promptKey, funFactText, guestName, isCouple = false, coupleRole = null },
  onProgress
) {
  let selfieUrl = existingSelfieUrl ?? null
  let selfieStoragePath = existingSelfieStoragePath ?? null

  if (selfieFile) {
    // Clean up the previous selfie in Storage (non-fatal if it fails)
    if (existingSelfieStoragePath) {
      try { await deleteObject(ref(storage, existingSelfieStoragePath)) } catch { /* non-fatal */ }
    }

    const ext = selfieFile.name.split('.').pop()
    const path = `selfies/${guestId}/${Date.now()}.${ext}`
    const storageRef = ref(storage, path)

    await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, selfieFile)
      task.on(
        'state_changed',
        snap => onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100),
        reject,
        async () => {
          try {
            selfieUrl = await getDownloadURL(task.snapshot.ref)
            selfieStoragePath = path
            resolve()
          } catch (err) { reject(err) }
        }
      )
    })
  }

  await setDoc(doc(db, 'guestProfiles', guestId), {
    guestId,
    guestName,
    promptKey,
    funFactText,
    isCouple,
    ...(coupleRole ? { coupleRole } : {}),
    selfieUrl,
    selfieStoragePath,
    updatedAt: serverTimestamp(),
  })

  return { selfieUrl, selfieStoragePath }
}

/** Deletes a guest's profile document and selfie from Storage (admin use). */
export async function deleteGuestProfile(guestId, storagePath) {
  if (storagePath) {
    try { await deleteObject(ref(storage, storagePath)) } catch { /* non-fatal */ }
  }
  await deleteDoc(doc(db, 'guestProfiles', guestId))
}
