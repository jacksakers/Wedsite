import { useState, useRef, useCallback } from 'react'
import heic2any from 'heic2any'
import {
  uploadVaultPhoto,
  getVaultPhotoPage,
  deleteVaultPhoto,
  VAULT_PAGE_SIZE,
} from '../../hooks/useVaultPhotos'

const GOOGLE_PHOTOS_URL = import.meta.env.VITE_GOOGLE_PHOTOS_URL ?? '#'

/** Single photo card in the vault grid. */
function VaultPhotoCard({ photo, isAdmin, onDelete, deleting }) {
  const firstName = photo.uploaderName?.split(' ')[0] ?? photo.uploaderName ?? 'Guest'

  function handleDownload() {
    const a = document.createElement('a')
    a.href = photo.url
    a.download = `vault-${photo.id}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  return (
    <div className="relative group rounded-lg overflow-hidden bg-sage/10 aspect-square">
      <img
        src={photo.url}
        alt={`Photo by ${firstName}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col justify-between p-2">
        {/* Uploader tag — always visible at bottom */}
        <div />
        <div className="translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-between">
          <span className="font-sans text-[11px] text-white/90 bg-black/50 rounded px-2 py-0.5 truncate max-w-[60%]">
            {firstName}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              title="Download"
              className="w-7 h-7 rounded bg-white/20 hover:bg-white/40 transition-colors flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDelete(photo)}
                disabled={deleting === photo.id}
                title="Delete"
                className="w-7 h-7 rounded bg-red-500/60 hover:bg-red-500/80 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Upload progress bar for a single file. */
function UploadItem({ name, progress, error }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs text-palmetto truncate">{name}</p>
        {error ? (
          <p className="font-sans text-[10px] text-red-500 mt-0.5">{error}</p>
        ) : (
          <div className="mt-1 h-1 bg-sage/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-palmetto transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <span className="font-sans text-[10px] text-sage/60 shrink-0">
        {error ? 'Failed' : progress >= 100 ? '✓' : `${Math.round(progress)}%`}
      </span>
    </div>
  )
}

/**
 * Photo Vault — the Digital Disposable Camera for the Lounge.
 * Guests upload photos; they appear on the live reception slideshow.
 */
export default function PhotoVault({ currentGuest, currentUser, isAdmin }) {
  const [photos,    setPhotos]    = useState([])
  const [lastDoc,   setLastDoc]   = useState(null)
  const [hasMore,   setHasMore]   = useState(true)
  const [loading,   setLoading]   = useState(false)
  const [loadError, setLoadError] = useState('')

  const [uploads,   setUploads]   = useState([])   // [{ name, progress, error }]
  const [deleting,  setDeleting]  = useState(null)

  const fileRef    = useRef(null)
  const initialized = useRef(false)

  // Load first page on mount via a stable callback
  const loadPage = useCallback(async (after = null) => {
    setLoading(true)
    setLoadError('')
    try {
      const { photos: page, lastDoc: cursor } = await getVaultPhotoPage(after)
      setPhotos(prev => after ? [...prev, ...page] : page)
      setLastDoc(cursor)
      setHasMore(page.length === VAULT_PAGE_SIZE)
    } catch {
      setLoadError('Could not load photos. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load — run once
  if (!initialized.current) {
    initialized.current = true
    loadPage(null)
  }

  async function handleFiles(files) {
    // Check for images OR explicitly check for HEIC/HEIF extensions as some browsers don't assign them an image/ MIME type
    const list = Array.from(files).filter(
      f => f.type.startsWith('image/') || f.name.toLowerCase().match(/\.hei[cf]$/)
    )
    if (!list.length) return

    const uploaderName    = currentGuest?.name ?? 'Guest'
    const uploaderUid     = currentUser?.uid
    const uploaderGuestId = currentGuest?.isCouple ? null : (currentGuest?.id ?? null)

    // Add upload tracker rows
    const trackers = list.map(f => ({ name: f.name, progress: 0, error: null }))
    setUploads(prev => [...trackers, ...prev])

    await Promise.allSettled(
      list.map(async (file, i) => {
        try {
          let fileToUpload = file;
          const isHeic = file.name.toLowerCase().match(/\.hei[cf]$/) || file.type.includes('heic') || file.type.includes('heif');

          if (isHeic) {
            // Give immediate feedback that we are processing
            setUploads(prev => {
              const next = [...prev];
              // Use a small progress bump to indicate it's working/converting
              next[i] = { ...next[i], progress: 5 }; 
              return next;
            });

            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8, // Adjust quality as needed to save space
            });

            // heic2any returns an array of blobs if it's an animation, so we grab the first frame
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            const newName = file.name.replace(/\.hei[cf]$/i, '.jpg');
            
            fileToUpload = new File([blob], newName, { type: 'image/jpeg' });
          }

          const { id, url } = await uploadVaultPhoto(
            fileToUpload,
            { uploaderName, uploaderUid, uploaderGuestId },
            pct => setUploads(prev => {
              const next = [...prev]
              // If we bumped it to 5% for conversion, scale the rest or just use pct
              next[i] = { ...next[i], progress: Math.max(next[i].progress, pct) }
              return next
            })
          );

          setUploads(prev => {
            const next = [...prev]
            next[i] = { ...next[i], progress: 100 }
            return next
          });

          // Prepend the new photo to the top of the grid
          setPhotos(prev => [{
            id,
            url,
            storagePath: `vaultPhotos/${id}`,
            uploaderName,
            uploaderUid,
            uploaderGuestId,
          }, ...prev]);

        } catch (error) {
          console.error("Upload error: ", error);
          setUploads(prev => {
            const next = [...prev]
            next[i] = { ...next[i], error: 'Upload failed' }
            return next
          });
        }
      })
    )

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.error))
    }, 3000)
  }

  async function handleDelete(photo) {
    if (!window.confirm('Remove this photo from the vault?')) return
    setDeleting(photo.id)
    try {
      await deleteVaultPhoto(photo.id, photo.storagePath)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch {
      alert('Could not delete photo. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const pendingUploads = uploads.filter(u => u.progress < 100 || u.error)

  return (
    <section className="py-8 px-4 md:px-6 max-w-4xl mx-auto relative" style={{ zIndex: 110 }}>

      {/* ── Header ── */}
      <div className="text-center mb-8">
        <p className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase mb-2">
          The Vault
        </p>
        <h2 className="font-serif text-palmetto text-4xl text-pressed mb-3">
          Photo Upload
        </h2>
        <p className="font-sans text-sage text-sm leading-relaxed max-w-sm mx-auto">
          Upload your candid shots — they'll appear live on the{' '}
          <span className="text-palmetto font-medium">reception slideshow</span>!
        </p>
      </div>

      {/* ── Google Photos banner ── */}
      <div className="border border-sage/20 rounded-lg px-5 py-4 mb-6 bg-sage/5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-palmetto text-sm font-medium">Want full-quality downloads?</p>
          <p className="font-sans text-sage text-xs mt-0.5 leading-relaxed">
            The vault is perfect for sharing on the day — but if you want to upload everything in
            original quality and easily download later, add them to our shared album.
          </p>
        </div>
        {GOOGLE_PHOTOS_URL !== '#' ? (
          <a
            href={GOOGLE_PHOTOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-sans text-xs tracking-[0.15em] uppercase border border-palmetto text-palmetto rounded px-4 py-2 hover:bg-palmetto hover:text-paper transition-colors"
          >
            Google Photos Album ↗
          </a>
        ) : (
          <span className="shrink-0 font-sans text-xs text-sage/50 italic">
            (Google Photos link coming soon)
          </span>
        )}
      </div>

      {/* ── Upload button ── */}
      <div className="mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-sage/30 hover:border-palmetto/50 rounded-lg py-6 font-sans text-sm text-sage hover:text-palmetto transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Tap to add photos
        </button>
      </div>

      {/* ── Upload progress ── */}
      {pendingUploads.length > 0 && (
        <div className="border border-sage/20 rounded-lg px-4 py-2 mb-5 divide-y divide-sage/10">
          {pendingUploads.map((u, i) => (
            <UploadItem key={i} {...u} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {loadError && (
        <p className="font-sans text-red-400 text-sm text-center py-6">{loadError}</p>
      )}

      {/* ── Photo grid ── */}
      {photos.length === 0 && !loading && !loadError && (
        <div className="text-center py-16">
          <p className="font-serif text-palmetto text-2xl text-pressed mb-2">Be the first!</p>
          <p className="font-sans text-sage text-sm">Upload a photo above to kick things off.</p>
        </div>
      )}

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
            {photos.map(photo => (
              <VaultPhotoCard
                key={photo.id}
                photo={photo}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => loadPage(lastDoc)}
                disabled={loading}
                className="font-sans text-xs tracking-[0.15em] uppercase border border-sage/30 rounded px-6 py-2.5 text-sage hover:border-sage hover:text-palmetto transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}

          {!hasMore && photos.length > VAULT_PAGE_SIZE && (
            <p className="font-sans text-[11px] text-sage/40 text-center">All {photos.length} photos loaded</p>
          )}
        </>
      )}

      {loading && photos.length === 0 && (
        <div className="text-center py-12">
          <p className="font-sans text-sage text-sm">Loading photos…</p>
        </div>
      )}
    </section>
  )
}