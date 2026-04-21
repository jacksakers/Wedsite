import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

/**
 * Uploads a photo to Firebase Storage and writes metadata to Firestore.
 * @param {File} file
 * @param {{ name: string, category: string, tags?: string[] }} meta
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<{ id: string, url: string }>}
 */
export function uploadPhoto(file, { name, category, tags = [] }, onProgress) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, `photos/${filename}`)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file)
    task.on(
      'state_changed',
      snap => onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          const docRef = await addDoc(collection(db, 'photos'), {
            url,
            storagePath: `photos/${filename}`,
            name: name || file.name,
            category,
            tags,
            uploadedAt: serverTimestamp(),
          })
          resolve({ id: docRef.id, url })
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

export async function getAllPhotos() {
  const snap = await getDocs(
    query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getPhotosByCategory(category) {
  const q = query(
    collection(db, 'photos'),
    where('category', '==', category),
    orderBy('uploadedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Returns a single random photo, optionally filtered by category. */
export async function getRandomPhoto(category) {
  const photos = category ? await getPhotosByCategory(category) : await getAllPhotos()
  if (!photos.length) return null
  return photos[Math.floor(Math.random() * photos.length)]
}

export async function updatePhotoMeta(id, data) {
  await updateDoc(doc(db, 'photos', id), data)
}

export async function deletePhoto(id, storagePath) {
  await deleteObject(ref(storage, storagePath))
  await deleteDoc(doc(db, 'photos', id))
}
