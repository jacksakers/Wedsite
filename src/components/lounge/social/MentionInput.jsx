import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Textarea with @mention and #hashtag autocomplete.
 * @param {{
 *   value: string,
 *   onChange: (val: string, mentions: {uid,name}[]) => void,
 *   guests: {id: string, name: string, uid?: string}[],
 *   existingMentions?: {uid: string, name: string}[],
 *   placeholder?: string,
 *   maxLength?: number,
 *   minRows?: number,
 *   className?: string,
 *   autoFocus?: boolean,
 * }}
 */
export default function MentionInput({
  value,
  onChange,
  guests = [],
  existingMentions = [],
  placeholder = 'Share something with the group…',
  maxLength = 1000,
  minRows = 3,
  className = '',
  autoFocus = false,
}) {
  const textareaRef = useRef(null)
  const [mention, setMention] = useState(null) // { query, start } | null
  const [hashSug, setHashSug] = useState(null)  // { query, start } | null
  const [mentionsMap, setMentionsMap] = useState(
    () => new Map(existingMentions.map(m => [m.name.split(' ')[0].toLowerCase(), m])),
  )

  // Common hashtag suggestions
  const HASH_SUGGESTIONS = ['wedding', 'love', 'family', 'friends', 'excited', 'cheers', 'memories']

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const handleInput = useCallback((e) => {
    const text = e.target.value
    const cursor = e.target.selectionStart

    // Detect @mention trigger: find last unfinished @word before cursor
    const beforeCursor = text.slice(0, cursor)
    const mentionMatch = beforeCursor.match(/@([\w]*)$/)
    const hashMatch = beforeCursor.match(/#([\w]*)$/)

    if (mentionMatch) {
      setMention({ query: mentionMatch[1].toLowerCase(), start: cursor - mentionMatch[0].length })
      setHashSug(null)
    } else if (hashMatch) {
      setHashSug({ query: hashMatch[1].toLowerCase(), start: cursor - hashMatch[0].length })
      setMention(null)
    } else {
      setMention(null)
      setHashSug(null)
    }

    onChange(text, Array.from(mentionsMap.values()))
  }, [mentionsMap, onChange])

  const pickMention = useCallback((guest) => {
    if (!textareaRef.current || mention === null) return
    const firstName = guest.name.split(' ')[0]
    const before = value.slice(0, mention.start)
    const after = value.slice(textareaRef.current.selectionStart)
    const newText = `${before}@${firstName} ${after}`

    const newMap = new Map(mentionsMap)
    newMap.set(firstName.toLowerCase(), { uid: guest.linkedUid ?? guest.uid ?? null, name: guest.name })
    setMentionsMap(newMap)
    setMention(null)
    onChange(newText, Array.from(newMap.values()))

    // Restore focus + cursor position
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = mention.start + firstName.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    })
  }, [value, mention, mentionsMap, onChange])

  const pickHashtag = useCallback((tag) => {
    if (!textareaRef.current || hashSug === null) return
    const before = value.slice(0, hashSug.start)
    const after = value.slice(textareaRef.current.selectionStart)
    const newText = `${before}#${tag} ${after}`
    setHashSug(null)
    onChange(newText, Array.from(mentionsMap.values()))
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = hashSug.start + tag.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    })
  }, [value, hashSug, mentionsMap, onChange])

  // Filter guests for @mention
  const filteredGuests = mention
    ? guests.filter(g => g.name.toLowerCase().includes(mention.query)).slice(0, 6)
    : []

  // Filter hashtag suggestions
  const filteredHash = hashSug
    ? HASH_SUGGESTIONS.filter(h => h.startsWith(hashSug.query)).slice(0, 5)
    : []

  const showMentionDrop = mention !== null && filteredGuests.length > 0
  const showHashDrop = hashSug !== null && filteredHash.length > 0

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={e => { if (e.key === 'Escape') { setMention(null); setHashSug(null) } }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        rows={minRows}
        className={`w-full resize-none border border-sage/30 rounded-lg px-4 py-3 font-sans text-palmetto text-sm bg-paper placeholder:text-sage/50 focus:outline-none focus:ring-2 focus:ring-sage/40 leading-relaxed transition-all ${className}`}
        style={{ overflow: 'hidden' }}
      />

      {/* @mention dropdown */}
      {showMentionDrop && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 bg-paper border border-sage/20 rounded-lg shadow-lg overflow-hidden"
          onMouseDown={e => e.preventDefault()}
        >
          {filteredGuests.map(g => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => pickMention(g)}
                className="w-full text-left px-4 py-2.5 font-sans text-sm text-palmetto hover:bg-sage/10 transition-colors flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-xs text-sage shrink-0">
                  {g.name[0]}
                </span>
                <span>{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* #hashtag dropdown */}
      {showHashDrop && (
        <div
          className="absolute z-50 left-0 mt-1 bg-paper border border-sage/20 rounded-lg shadow-lg overflow-hidden flex flex-wrap gap-1.5 p-2"
          onMouseDown={e => e.preventDefault()}
        >
          {filteredHash.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => pickHashtag(tag)}
              className="px-2.5 py-1 bg-palmetto/10 text-palmetto text-xs rounded-full hover:bg-palmetto/20 transition-colors font-sans"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Character count */}
      {value.length > maxLength * 0.8 && (
        <p className="absolute bottom-2 right-3 text-[10px] font-sans text-sage/60 pointer-events-none">
          {maxLength - value.length}
        </p>
      )}
    </div>
  )
}
