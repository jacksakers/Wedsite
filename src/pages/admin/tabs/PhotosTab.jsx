import { useState, useEffect, useRef } from 'react'
import { getAllPhotos, uploadPhoto, updatePhotoMeta, deletePhoto } from '../../../hooks/usePhotos'

const CATEGORIES = ['general', 'engagement', 'our-story', 'home', 'travel', 'other']

function UploadZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) onFiles(files)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
        dragging ? 'border-sage bg-sage/10' : 'border-sage/30 hover:border-sage/60'
      }`}
    >
      <p className="font-sans text-sage text-sm">Drag & drop photos here, or click to browse</p>
      <p className="font-sans text-sage/50 text-xs mt-1">JPG, PNG, WEBP supported</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) onFiles(Array.from(e.target.files)) }}
      />
    </div>
  )
}

function EditModal({ photo, onSave, onClose }) {
  const [name, setName] = useState(photo.name || '')
  const [category, setCategory] = useState(photo.category || 'general')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(photo.id, { name: name.trim() || photo.name, category })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-paper rounded-lg w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-serif text-palmetto text-xl mb-4">Edit Photo</h3>
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full aspect-video object-cover rounded mb-4"
        />
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Photo name"
            className="border border-sage/40 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-sage/40 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-3 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-xs tracking-widest uppercase text-sage hover:text-palmetto transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PhotoGrid({ photos, onEdit, onDelete, deleting }) {
  const [filter, setFilter] = useState('all')
  const usedCategories = ['all', ...new Set(photos.map(p => p.category).filter(Boolean))]
  const filtered = filter === 'all' ? photos : photos.filter(p => p.category === filter)

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {usedCategories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`font-sans text-xs uppercase tracking-widest px-3 py-1 rounded-full border transition-colors ${
              filter === c
                ? 'bg-palmetto text-paper border-palmetto'
                : 'border-sage/30 text-sage hover:border-sage'
            }`}
          >
            {c === 'all'
              ? `All (${photos.length})`
              : `${c} (${photos.filter(p => p.category === c).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map(photo => (
          <div key={photo.id} className="relative group rounded overflow-hidden border border-sage/10">
            <img src={photo.url} alt={photo.name} className="w-full aspect-square object-cover" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-palmetto/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <p className="font-sans text-paper text-xs truncate mb-2">{photo.name}</p>
              <p className="font-sans text-paper/60 text-xs mb-2">{photo.category}</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onEdit(photo)}
                  className="flex-1 font-sans text-xs uppercase tracking-wide bg-paper/20 hover:bg-paper/30 text-paper py-1 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(photo)}
                  disabled={deleting === photo.id}
                  className="flex-1 font-sans text-xs uppercase tracking-wide bg-red-500/60 hover:bg-red-500/80 text-paper py-1 rounded transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PhotosTab() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingFiles, setPendingFiles] = useState([])
  const [pendingCategory, setPendingCategory] = useState('general')
  const [uploadQueue, setUploadQueue] = useState([])
  const [editPhoto, setEditPhoto] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    getAllPhotos().then(setPhotos).finally(() => setLoading(false))
  }, [])

  async function handleUpload() {
    if (!pendingFiles.length) return
    const queue = pendingFiles.map(f => ({
      file: f, name: f.name, category: pendingCategory, progress: 0, done: false, error: false,
    }))
    setUploadQueue(queue)
    setPendingFiles([])

    for (let i = 0; i < queue.length; i++) {
      try {
        await uploadPhoto(
          queue[i].file,
          { name: queue[i].name, category: queue[i].category },
          pct => setUploadQueue(q => q.map((item, j) => j === i ? { ...item, progress: pct } : item))
        )
        setUploadQueue(q => q.map((item, j) => j === i ? { ...item, done: true, progress: 100 } : item))
      } catch {
        setUploadQueue(q => q.map((item, j) => j === i ? { ...item, error: true } : item))
      }
    }
    // Refresh gallery
    const refreshed = await getAllPhotos()
    setPhotos(refreshed)
  }

  async function handleEditSave(id, data) {
    await updatePhotoMeta(id, data)
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    setEditPhoto(null)
  }

  async function handleDelete(photo) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return
    setDeleting(photo.id)
    try {
      await deletePhoto(photo.id, photo.storagePath)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <h2 className="font-serif text-palmetto text-2xl mb-2 text-pressed">Photo Repository</h2>
      <p className="font-sans text-sage text-xs mb-6">
        Upload and organize couple photos by category. Pull specific photos by category in pages
        like Our Story, or use <code className="font-mono bg-sage/10 px-1 rounded">getRandomPhoto('engagement')</code> for rotating hero shots.
      </p>

      {/* Upload panel */}
      <div className="border border-sage/20 rounded-lg p-6 mb-8">
        <h3 className="font-serif text-palmetto text-lg mb-4">Upload Photos</h3>
        <UploadZone onFiles={setPendingFiles} />

        {pendingFiles.length > 0 && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="font-sans text-sage text-sm">
              {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} selected
            </span>
            <label className="font-sans text-xs uppercase tracking-widest text-sage">Category:</label>
            <select
              value={pendingCategory}
              onChange={e => setPendingCategory(e.target.value)}
              className="border border-sage/40 rounded px-3 py-1.5 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={handleUpload}
              className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors"
            >
              Upload
            </button>
            <button
              onClick={() => setPendingFiles([])}
              className="font-sans text-xs text-sage hover:text-palmetto uppercase tracking-widest transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Upload progress queue */}
        {uploadQueue.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {uploadQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-sage/5 rounded px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-palmetto text-sm truncate">{item.name}</p>
                  <div className="h-1 bg-sage/20 rounded-full mt-1.5">
                    <div
                      className="h-full bg-sage rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                {item.done && <span className="font-sans text-sage text-xs shrink-0">✓</span>}
                {item.error && <span className="font-sans text-red-400 text-xs shrink-0">Error</span>}
              </div>
            ))}
            {uploadQueue.every(q => q.done || q.error) && (
              <button
                onClick={() => setUploadQueue([])}
                className="font-sans text-xs text-sage hover:text-palmetto uppercase tracking-widest self-start mt-1 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photo gallery */}
      {loading ? (
        <p className="font-sans text-sage text-center py-12">Loading photos…</p>
      ) : photos.length === 0 ? (
        <p className="font-sans text-sage text-center py-12">No photos yet. Upload some above.</p>
      ) : (
        <PhotoGrid
          photos={photos}
          onEdit={setEditPhoto}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}

      {editPhoto && (
        <EditModal
          photo={editPhoto}
          onSave={handleEditSave}
          onClose={() => setEditPhoto(null)}
        />
      )}
    </div>
  )
}
