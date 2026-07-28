import { useState } from 'react'
import { lookupGuest, searchGuests } from '../../hooks/useRSVP'

export default function StepLookup({ onFound }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])

  function handleNameChange(e) {
    setName(e.target.value)
    setSuggestions([])
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuggestions([])
    setLoading(true)
    try {
      // Try exact match first — preserves existing behavior
      const guest = await lookupGuest(name)
      if (guest) {
        onFound(guest)
        return
      }
      // Fall back to fuzzy/partial search
      const matches = await searchGuests(name)
      if (matches.length === 0) {
        setError(
          "We couldn't find your invitation. Please double-check your name or contact us directly."
        )
      } else {
        setSuggestions(matches)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      <h2 className="font-serif text-palmetto text-3xl mb-3">Find Your Invitation</h2>
      <p className="font-sans text-sage text-sm mb-8">
        Enter your name as it appears on your invitation. You can also search by first name to find your group.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Jane Smith"
          className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
        />
        {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
        {suggestions.length > 0 && (
          <div className="text-left">
            <p className="font-sans text-sage text-xs tracking-[0.15em] uppercase mb-2">
              Did you mean?
            </p>
            <ul className="flex flex-col gap-1">
              {suggestions.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onFound(s)}
                    className="w-full text-left px-4 py-2 font-sans text-palmetto text-sm rounded border border-sage/30 bg-paper hover:bg-sage/10 transition-colors"
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Find My Invitation'}
        </button>
      </form>
    </div>
  )
}
