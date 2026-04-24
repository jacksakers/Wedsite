import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

export const VAULT_PAGE_SIZE = 12

/**
 * Upload a single photo to the Photo Vault.
 * Stores under Storage at vaultPhotos/{filename} and writes metadata to
 * the vaultPhotos Firestore collection.
 *
 * @param {File} file
 * @param {{ uploaderName: string, uploaderUid: string, uploaderGuestId: string|null }} meta
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ id: string, url: string }>}
 */
export function uploadVaultPhoto(file, { uploaderName, uploaderUid, uploaderGuestId }, onProgress) {
  const ext      = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, `vaultPhotos/${filename}`)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap => onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100),
      reject,
      async () => {
        try {
          const url    = await getDownloadURL(task.snapshot.ref)
          const docRef = await addDoc(collection(db, 'vaultPhotos'), {
            url,
            storagePath:     `vaultPhotos/${filename}`,
            uploaderName,
            uploaderUid,
            uploaderGuestId: uploaderGuestId ?? null,
            uploadedAt:      serverTimestamp(),
          })
          resolve({ id: docRef.id, url })
        } catch (err) {
          reject(err)
        }
      },
    )
  })
}

/**
 * Real-time listener for the Photo Vault — used by the slideshow.
 * Returns newest photos first.
 * @returns unsubscribe fn
 */
export function subscribeToVaultPhotos({ onUpdate, onError }) {
  const q = query(
    collection(db, 'vaultPhotos'),
    orderBy('uploadedAt', 'desc'),
  )
  return onSnapshot(
    q,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => {
      console.error('[useVaultPhotos] subscribe error:', err)
      onError?.(err)
    },
  )
}

/**
 * Fetch one page of vault photos for the paginated gallery.
 * @param {import('firebase/firestore').QueryDocumentSnapshot|null} afterDoc
 * @returns {Promise<{ photos: object[], lastDoc: object|null }>}
 */
export async function getVaultPhotoPage(afterDoc = null) {
  let q = query(
    collection(db, 'vaultPhotos'),
    orderBy('uploadedAt', 'desc'),
    limit(VAULT_PAGE_SIZE),
  )
  if (afterDoc) q = query(q, startAfter(afterDoc))

  const snap = await getDocs(q)
  const photos  = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null
  return { photos, lastDoc }
}

/**
 * Delete a vault photo from Storage and Firestore (admin only).
 */
export async function deleteVaultPhoto(id, storagePath) {
  await deleteObject(ref(storage, storagePath))
  await deleteDoc(doc(db, 'vaultPhotos', id))
}
