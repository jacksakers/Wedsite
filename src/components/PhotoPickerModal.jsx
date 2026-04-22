import { useState, useEffect, useRef } from 'react'
import { getAllPhotos, uploadPhoto } from '../hooks/usePhotos'

/**
 * Modal for selecting a photo from the library or uploading a new one.
 *
 * Props:
 *   onSelect(url: string) — called with the chosen photo URL
 *   onClose()             — called when the modal is dismissed
 */
export default function PhotoPickerModal({ onSelect, onClose }) {
  const [tab, setTab] = useState('library')
  const [photos, setPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    getAllPhotos()
      .then(setPhotos)
      .catch(() => {})
      .finally(() => setLoadingPhotos(false))
  }, [])

  async function handleFileUpload(file) {
    if (!file) return
    setUploading(true)
    setUploadError('')
    setUploadProgress(0)
    try {
      const name = file.name.replace(/\.[^.]+$/, '')
      const { url } = await uploadPhoto(
        file,
        { name, category: 'our-story' },
        pct => setUploadProgress(Math.round(pct)),
      )
      onSelect(url)
    } catch {
      setUploadError('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-paper rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage/20">
          <h3 className="font-serif text-palmetto text-xl">Select a Photo</h3>
          <button
            onClick={onClose}
            className="font-sans text-sage hover:text-palmetto text-lg leading-none transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {[['library', 'Photo Library'], ['upload', 'Upload New']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 rounded transition-colors ${
                tab === id ? 'bg-palmetto text-paper' : 'text-sage hover:text-palmetto'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'library' && (
            <>
              {loadingPhotos && (
                <p className="font-sans text-sage text-sm text-center py-10">Loading photos…</p>
              )}
              {!loadingPhotos && photos.length === 0 && (
                <p className="font-sans text-sage text-sm text-center py-10">
                  No photos in the library yet. Upload some in the Photos tab first.
                </p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => onSelect(photo.url)}
                    className="relative group rounded overflow-hidden border border-sage/20 hover:border-sage transition-colors focus:outline-none focus:ring-2 focus:ring-sage"
                    title={photo.name}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-palmetto/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-sans text-paper text-xs tracking-wide uppercase">Select</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'upload' && (
            <div>
              <div
                onClick={() => !uploading && inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                  uploading
                    ? 'border-sage/30 cursor-default'
                    : 'border-sage/30 hover:border-sage/70 cursor-pointer'
                }`}
              >
                {uploading ? (
                  <>
                    <p className="font-sans text-sage text-sm mb-3">Uploading…</p>
                    <div className="w-full bg-sage/20 rounded-full h-1.5 max-w-xs mx-auto">
                      <div
                        className="bg-sage h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="font-sans text-sage/60 text-xs mt-2">{uploadProgress}%</p>
                  </>
                ) : (
                  <>
                    <p className="font-sans text-sage text-sm">Click to choose a photo</p>
                    <p className="font-sans text-sage/50 text-xs mt-1">JPG, PNG, WEBP · uploaded to Photo Library</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files?.[0])}
                />
              </div>
              {uploadError && (
                <p className="font-sans text-red-500 text-sm mt-3 text-center">{uploadError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
