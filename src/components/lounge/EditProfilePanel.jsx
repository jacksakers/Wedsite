import { useState, useRef, useEffect } from 'react'
import heic2any from 'heic2any'
import { saveGuestProfile, getGuestProfile, FUN_FACT_PROMPTS } from '../../hooks/useGuestProfiles'

const INPUT_CLS = 'w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50'
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`

export default function EditProfilePanel({ guest, onSaved }) {
  const guestId   = guest?.id
  const guestName = guest?.name ?? ''

  const [mode, setMode]           = useState('loading') // 'loading' | 'view' | 'edit'
  const [profile, setProfile]     = useState(null)
  const [promptKey, setPromptKey] = useState(FUN_FACT_PROMPTS[0].key)
  const [funFactText, setFunFactText] = useState('')
  const [selfieFile, setSelfieFile]   = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [uploadPct, setUploadPct] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [processingImage, setProcessingImage] = useState(false) // Added for HEIC processing
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  // Load existing profile on mount
  useEffect(() => {
    if (!guestId) return
    getGuestProfile(guestId)
      .then(p => {
        setProfile(p)
        if (p) {
          setPromptKey(p.promptKey ?? FUN_FACT_PROMPTS[0].key)
          setFunFactText(p.funFactText ?? '')
        }
        setMode(p ? 'view' : 'edit')
      })
      .catch(() => setMode('edit'))
  }, [guestId])

  function openEdit() {
    if (profile) {
      setPromptKey(profile.promptKey ?? FUN_FACT_PROMPTS[0].key)
      setFunFactText(profile.funFactText ?? '')
    }
    setSelfieFile(null)
    setSelfiePreview(null)
    setError('')
    setMode('edit')
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const isHeic = file.name.toLowerCase().match(/\.hei[cf]$/) || file.type.includes('heic') || file.type.includes('heif')

    if (isHeic) {
      setProcessingImage(true)
      setError('')
      try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8,
        })
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
        const newName = file.name.replace(/\.hei[cf]$/i, '.jpg')
        const convertedFile = new File([blob], newName, { type: 'image/jpeg' })

        setSelfieFile(convertedFile)
        setSelfiePreview(URL.createObjectURL(convertedFile))
      } catch (err) {
        console.error("HEIC conversion failed:", err)
        setError('Failed to process image. Please try a different photo.')
      } finally {
        setProcessingImage(false)
        // Reset the input so the same file can be selected again if needed
        if (fileRef.current) fileRef.current.value = ''
      }
    } else {
      setSelfieFile(file)
      setSelfiePreview(URL.createObjectURL(file))
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!funFactText.trim()) { setError('Please write something about yourself.'); return }
    setError('')
    setSaving(true)
    try {
      const result = await saveGuestProfile(
        guestId,
        {
          selfieFile,
          existingSelfieUrl:         profile?.selfieUrl         ?? null,
          existingSelfieStoragePath: profile?.selfieStoragePath ?? null,
          promptKey,
          funFactText: funFactText.trim(),
          guestName,
        },
        pct => setUploadPct(Math.round(pct))
      )
      const updated = {
        id: guestId,
        guestId,
        guestName,
        promptKey,
        funFactText: funFactText.trim(),
        selfieUrl:         selfieFile ? result.selfieUrl         : (profile?.selfieUrl         ?? null),
        selfieStoragePath: selfieFile ? result.selfieStoragePath : (profile?.selfieStoragePath ?? null),
      }
      setProfile(updated)
      setMode('view')
      onSaved?.(updated)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
      setUploadPct(null)
    }
  }

  const currentPrompt = FUN_FACT_PROMPTS.find(p => p.key === promptKey)
  const previewSrc    = selfiePreview ?? profile?.selfieUrl ?? null
  const firstName     = guestName.split(' ')[0]

  if (mode === 'loading') {
    return <div className="py-6 text-center"><p className="font-sans text-sage text-sm">Loading…</p></div>
  }

  // ── VIEW mode ──────────────────────────────────────────────────────────────
  if (mode === 'view' && profile) {
    const viewPrompt = FUN_FACT_PROMPTS.find(p => p.key === profile.promptKey)?.label ?? ''
    return (
      <div className="flex gap-5 items-start">
        {/* Selfie thumbnail */}
        <div
          className="shrink-0 bg-sage/10 overflow-hidden"
          style={{ width: 80, height: 80, borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}
        >
          {profile.selfieUrl
            ? <img src={profile.selfieUrl} alt={firstName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><span className="font-serif text-sage/40 text-3xl">?</span></div>
          }
        </div>

        {/* Fun fact preview */}
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sage/60 text-[10px] tracking-[0.2em] uppercase mb-1">{viewPrompt}</p>
          <p className="font-serif text-palmetto text-sm leading-snug text-pressed line-clamp-3">
            {profile.funFactText}
          </p>
          <button
            onClick={openEdit}
            className="font-sans text-sage/60 text-[10px] tracking-[0.2em] uppercase hover:text-palmetto transition-colors mt-3 underline underline-offset-2"
          >
            Edit your intro
          </button>
        </div>
      </div>
    )
  }

  // ── EDIT mode ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Selfie upload */}
      <div>
        <p className="font-sans text-sage/70 text-[10px] tracking-[0.2em] uppercase mb-3">Your Photo</p>
        <div className="flex items-center gap-5">
          {/* Preview */}
          <button
            type="button"
            onClick={() => !processingImage && fileRef.current?.click()}
            disabled={processingImage}
            className={`shrink-0 bg-sage/10 overflow-hidden hover:bg-sage/20 transition-colors group relative ${processingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ width: 90, height: 90, borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}
            aria-label="Upload selfie"
          >
            {processingImage ? (
              <div className="w-full h-full flex items-center justify-center flex-col gap-1">
                <span className="font-sans text-sage/60 text-[10px] uppercase">Processing...</span>
              </div>
            ) : previewSrc ? (
              <img src={previewSrc} alt="Your selfie" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-1">
                <span className="font-serif text-sage/40 text-3xl">+</span>
              </div>
            )}
            {!processingImage && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="font-sans text-paper text-[10px] tracking-widest uppercase">change</span>
              </div>
            )}
          </button>

          <div>
            <p className="font-sans text-palmetto text-sm mb-1">
              {processingImage ? 'Converting image...' : previewSrc ? 'Looking good!' : 'Add a selfie'}
            </p>
            <p className="font-sans text-sage text-xs leading-relaxed">
              {previewSrc
                ? 'Click your photo to pick a different one.'
                : 'This is optional, but guests love putting a face to a name.'}
            </p>
            {!previewSrc && !processingImage && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-sans text-sage text-xs underline underline-offset-2 hover:text-palmetto transition-colors mt-2"
              >
                Choose photo
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          disabled={processingImage}
          onChange={handleFileChange}
        />
      </div>

      {/* Prompt selector */}
      <div>
        <p className="font-sans text-sage/70 text-[10px] tracking-[0.2em] uppercase mb-3">Choose a prompt</p>
        <div className="flex flex-wrap gap-2">
          {FUN_FACT_PROMPTS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPromptKey(p.key)}
              className={`px-3 py-1.5 rounded font-sans text-xs tracking-[0.1em] border transition-colors ${
                promptKey === p.key
                  ? 'bg-palmetto text-paper border-palmetto'
                  : 'bg-paper text-sage border-sage/40 hover:border-sage'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fun fact text */}
      <div>
        <p className="font-sans text-sage/70 text-[10px] tracking-[0.2em] uppercase mb-2">
          {currentPrompt?.label ?? 'Your answer'}
        </p>
        <textarea
          value={funFactText}
          onChange={e => setFunFactText(e.target.value)}
          placeholder={currentPrompt?.placeholder ?? 'Write something…'}
          rows={4}
          className={TEXTAREA_CLS}
        />
        <p className="font-sans text-sage/40 text-[10px] mt-1">
          Write as much or as little as you'd like — this shows on the back of your polaroid.
        </p>
      </div>

      {error && <p className="font-sans text-red-500 text-sm">{error}</p>}

      {uploadPct !== null && (
        <div className="w-full bg-sage/20 rounded-full h-1">
          <div
            className="bg-palmetto h-1 rounded-full transition-all"
            style={{ width: `${uploadPct}%` }}
          />
        </div>
      )}

      <div className="flex gap-3">
        {profile && (
          <button
            type="button"
            onClick={() => setMode('view')}
            disabled={processingImage || saving}
            className="font-sans text-xs tracking-[0.2em] uppercase text-sage hover:text-palmetto transition-colors px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || processingImage || !funFactText.trim()}
          className="flex-1 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {saving
            ? (uploadPct !== null ? `Uploading… ${uploadPct}%` : 'Saving…')
            : processingImage
            ? 'Processing Photo...'
            : (profile ? 'Save changes' : 'Add to the wall →')
          }
        </button>
      </div>
    </div>
  )
}