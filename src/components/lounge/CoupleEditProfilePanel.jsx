import { useState, useRef, useEffect } from 'react'
import { saveGuestProfile, getGuestProfile } from '../../hooks/useGuestProfiles'

const TEXTAREA_CLS = 'w-full border border-sunrise-pink/30 rounded px-4 py-3 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sunrise-pink/40 resize-none'

export default function CoupleEditProfilePanel({ guest, onSaved }) {
  const guestId   = guest?.id
  const guestName = guest?.name ?? ''
  const role      = guest?.role ?? ''

  const [mode, setMode]           = useState('loading') // 'loading' | 'view' | 'edit'
  const [profile, setProfile]     = useState(null)
  const [noteText, setNoteText]   = useState('')
  const [selfieFile, setSelfieFile]     = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [uploadPct, setUploadPct] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!guestId) return
    getGuestProfile(guestId)
      .then(p => {
        setProfile(p)
        if (p) setNoteText(p.funFactText ?? '')
        setMode(p ? 'view' : 'edit')
      })
      .catch(() => setMode('edit'))
  }, [guestId])

  function openEdit() {
    if (profile) setNoteText(profile.funFactText ?? '')
    setSelfieFile(null)
    setSelfiePreview(null)
    setError('')
    setMode('edit')
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelfieFile(file)
    setSelfiePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const result = await saveGuestProfile(
        guestId,
        {
          selfieFile,
          existingSelfieUrl:         profile?.selfieUrl         ?? null,
          existingSelfieStoragePath: profile?.selfieStoragePath ?? null,
          promptKey:    'couple_note',
          funFactText:  noteText.trim(),
          guestName,
          isCouple:     true,
          coupleRole:   role,
        },
        pct => setUploadPct(Math.round(pct))
      )
      const updated = {
        id: guestId,
        guestId,
        guestName,
        promptKey:    'couple_note',
        funFactText:  noteText.trim(),
        isCouple:     true,
        coupleRole:   role,
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

  const previewSrc = selfiePreview ?? profile?.selfieUrl ?? null
  const roleLabel  = role === 'bride' ? 'The Bride' : 'The Groom'

  if (mode === 'loading') {
    return <div className="py-6 text-center"><p className="font-sans text-sage text-sm">Loading…</p></div>
  }

  // ── VIEW mode ──────────────────────────────────────────────────────────────
  if (mode === 'view' && profile) {
    return (
      <div className="flex gap-5 items-start">
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 80,
            height: 80,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
            background: '#5c7543',
          }}
        >
          {profile.selfieUrl
            ? <img src={profile.selfieUrl} alt={guestName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-sunrise-pink/60 text-3xl">♡</span>
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sunrise-pink/70 text-[10px] tracking-[0.25em] uppercase mb-1">{roleLabel}</p>
          <p className="font-serif text-palmetto text-sm leading-snug text-pressed line-clamp-3">
            {profile.funFactText || <span className="text-sage/40 italic">No note yet.</span>}
          </p>
          <button
            onClick={openEdit}
            className="font-sans text-sage/60 text-[10px] tracking-[0.2em] uppercase hover:text-palmetto transition-colors mt-3 underline underline-offset-2"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  // ── EDIT mode ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Photo upload */}
      <div>
        <p className="font-sans text-sage/70 text-[10px] tracking-[0.2em] uppercase mb-3">Your Photo</p>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 overflow-hidden hover:opacity-90 transition-opacity group relative"
            style={{ width: 90, height: 90, borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.28)', background: '#5c7543' }}
            aria-label="Upload photo"
          >
            {previewSrc
              ? <img src={previewSrc} alt="Your photo" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-sunrise-pink/60 text-3xl">+</span>
                </div>
            }
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="font-sans text-paper text-[10px] tracking-widest uppercase">change</span>
            </div>
          </button>
          <div>
            <p className="font-sans text-palmetto text-sm mb-1">{previewSrc ? 'Looking wonderful!' : 'Add your photo'}</p>
            <p className="font-sans text-sage text-xs leading-relaxed">
              {previewSrc ? 'Click to choose a different one.' : 'This will appear on your special polaroid.'}
            </p>
            {!previewSrc && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="font-sans text-sage text-xs underline underline-offset-2 hover:text-palmetto transition-colors mt-2">
                Choose photo
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Note */}
      <div>
        <p className="font-sans text-sage/70 text-[10px] tracking-[0.2em] uppercase mb-2">
          A note to your guests
        </p>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="We're so glad you're here…"
          rows={4}
          className={TEXTAREA_CLS}
        />
        <p className="font-sans text-sage/40 text-[10px] mt-1">
          This shows on the back of your polaroid for all guests to read.
        </p>
      </div>

      {error && <p className="font-sans text-red-500 text-sm">{error}</p>}

      {uploadPct !== null && (
        <div className="w-full bg-sage/20 rounded-full h-1">
          <div className="bg-palmetto h-1 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
        </div>
      )}

      <div className="flex gap-3">
        {profile && (
          <button type="button" onClick={() => setMode('view')}
            className="font-sans text-xs tracking-[0.2em] uppercase text-sage hover:text-palmetto transition-colors px-4 py-2">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {saving
            ? (uploadPct !== null ? `Uploading… ${uploadPct}%` : 'Saving…')
            : (profile ? 'Save changes' : 'Add to the wall →')
          }
        </button>
      </div>
    </div>
  )
}
