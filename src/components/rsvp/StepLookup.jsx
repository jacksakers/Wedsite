import { useState } from 'react'
import { lookupGuest } from '../../hooks/useRSVP'

export default function StepLookup({ onFound }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const guest = await lookupGuest(name)
      if (!guest) {
        setError(
          "We couldn't find your invitation. Please double-check your name or contact us directly."
        )
      } else {
        onFound(guest)
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
        Enter your first and last name exactly as it appears on your invitation.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
        />
        {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
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
