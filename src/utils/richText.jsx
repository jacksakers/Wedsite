import React from 'react'

/**
 * Parse text content into segments: plain text, #hashtags, @mentions.
 * Returns an array of { type: 'text'|'hashtag'|'mention', value: string }.
 */
export function parseRichText(text) {
  if (!text) return []
  const segments = []
  const regex = /(#[a-zA-Z0-9_]+|@[\w]+)/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const value = match[0]
    if (value.startsWith('#')) {
      segments.push({ type: 'hashtag', value: value.slice(1) })
    } else {
      segments.push({ type: 'mention', value: value.slice(1) })
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

/**
 * Render rich text with clickable hashtags and mentions.
 * @param {{ text: string, onHashtag?: (tag: string) => void, onMention?: (name: string) => void, className?: string }}
 */
export function RichText({ text, onHashtag, onMention, className = '' }) {
  const segments = parseRichText(text)
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'hashtag') {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onHashtag?.(seg.value)}
              className="text-palmetto font-medium hover:underline focus:outline-none"
            >
              #{seg.value}
            </button>
          )
        }
        if (seg.type === 'mention') {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onMention?.(seg.value)}
              className="text-sage font-medium hover:underline focus:outline-none"
            >
              @{seg.value}
            </button>
          )
        }
        // Preserve newlines
        return (
          <React.Fragment key={i}>
            {seg.value.split('\n').map((line, j, arr) => (
              <React.Fragment key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        )
      })}
    </span>
  )
}

/** Format a Firestore Timestamp or Date as a relative time string. */
export function timeAgo(ts) {
  if (!ts) return ''
  const ms = typeof ts.toDate === 'function' ? ts.toDate().getTime() : ts
  const seconds = Math.floor((Date.now() - ms) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Truncate text to N chars with ellipsis. */
export function truncate(text, n = 80) {
  if (!text || text.length <= n) return text
  return text.slice(0, n).trimEnd() + '…'
}
