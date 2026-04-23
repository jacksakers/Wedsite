import { useState, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useGuestIdentity } from '../../../context/GuestIdentityContext'
import { createPost, updatePost, parseHashtags } from '../../../hooks/usePosts'
import MentionInput from './MentionInput'

const COMPOSER_PROMPTS = [
  'Share a memory with the couple…',
  'Drop a fun fact about yourself…',
  'What are you most excited about?',
  'Share a song recommendation…',
  'Leave a note for the guests…',
  'What\'s your wedding day prediction?',
]

function getPrompt() {
  return COMPOSER_PROMPTS[Math.floor(Date.now() / 86400000) % COMPOSER_PROMPTS.length]
}

/**
 * Composer for creating or editing a post.
 * @param {{
 *   guests: object[],
 *   currentGuest: object,
 *   currentUser: object,
 *   isAdmin: boolean,
 *   editingPost?: object,
 *   onSaved: () => void,
 *   onCancel?: () => void,
 * }}
 */
export default function PostComposer({ guests, currentGuest, currentUser, isAdmin, editingPost = null, onSaved, onCancel }) {
  const [text, setText]           = useState(editingPost?.content ?? '')
  const [mentions, setMentions]   = useState(editingPost?.mentions ?? [])
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(editingPost?.photoUrl ?? null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [isPrivate, setIsPrivate] = useState(editingPost?.isPrivate ?? false)
  const [progress, setProgress]   = useState(0)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  const isEditing = Boolean(editingPost)
  const placeholder = isEditing ? 'Edit your post…' : getPrompt()

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setRemovePhoto(false)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleTextChange(val, newMentions) {
    setText(val)
    setMentions(newMentions)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() && !photoPreview) return
    setError('')
    setSaving(true)
    try {
      const hashtags = parseHashtags(text)
      if (isEditing) {
        await updatePost(
          editingPost.id,
          {
            content: text.trim(),
            hashtags,
            mentions,
            photoFile,
            removePhoto,
            existingStoragePath: editingPost.storagePath,
          },
          setProgress,
        )
      } else {
        await createPost(
          {
            content: text.trim(),
            authorUid: currentUser.uid,
            authorGuestId: currentGuest.isCouple ? null : currentGuest.id,
            authorName: currentGuest.name,
            authorRole: currentGuest.isCouple ? currentGuest.role : 'guest',
            isPrivate,
            photoFile,
            hashtags,
            mentions,
          },
          setProgress,
        )
      }
      onSaved()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const canPost = (text.trim().length > 0 || photoPreview) && !saving

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <MentionInput
        value={text}
        onChange={handleTextChange}
        guests={guests}
        existingMentions={mentions}
        placeholder={placeholder}
        autoFocus={isEditing}
      />

      {/* Photo preview */}
      {photoPreview && (
        <div className="relative rounded-lg overflow-hidden border border-sage/20">
          <img
            src={photoPreview}
            alt="Post photo"
            className="w-full max-h-64 object-cover"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute top-2 right-2 bg-palmetto/80 text-paper rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-palmetto transition-colors"
            aria-label="Remove photo"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload progress */}
      {saving && progress > 0 && progress < 100 && (
        <div className="w-full bg-sage/20 rounded-full h-1">
          <div
            className="bg-palmetto h-1 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="font-sans text-red-500 text-xs">{error}</p>}

      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Photo upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sage/30 text-sage text-xs font-sans hover:border-sage transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          {/* Private toggle (admins only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsPrivate(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-sans transition-colors ${
                isPrivate
                  ? 'border-sunrise-orange bg-sunrise-orange/10 text-sunrise-orange'
                  : 'border-sage/30 text-sage hover:border-sage'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {isPrivate ? 'Just the couple' : 'Private'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 font-sans text-xs text-sage hover:text-palmetto transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canPost}
            className="px-5 py-1.5 bg-palmetto text-paper font-sans text-xs tracking-[0.15em] uppercase rounded-lg hover:bg-palmetto/80 transition-colors disabled:opacity-40"
          >
            {saving ? 'Posting…' : isEditing ? 'Save' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  )
}
