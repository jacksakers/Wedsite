import { useState, useEffect, useRef } from 'react'
import { getAllGuests } from '../../hooks/useGuests'
import { useGuestIdentity } from '../../context/GuestIdentityContext'

export default function IdentityClaimFlow() {
  const { claimIdentity } = useGuestIdentity()
  const [guests, setGuests] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    getAllGuests()
      .then(all => {
        // Only show guests who haven't already claimed an identity
        setGuests(all.filter(g => !g.linkedUid))
      })
      .catch(() => setError('Could not load the guest list. Please refresh and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase().trim())
  )

  async function handleClaim() {
    if (!selected) return
    setError('')
    setClaiming(true)
    try {
      await claimIdentity(selected.id)
    } catch {
      setError('Something went wrong. Please try again.')
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="font-sans text-sage text-sm">Loading guest list…</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase mb-3">
        One Last Step
      </p>
      <h2 className="font-serif text-palmetto text-4xl mb-4 text-pressed">
        Who are you?
      </h2>
      <p className="font-sans text-sage text-sm leading-relaxed mb-10">
        Find your name below to personalize your experience. This links your
        session to your invitation — you'll only need to do this once.
      </p>

      {selected ? (
        <div className="bg-sage/10 border border-sage/30 rounded-lg p-6 mb-6 text-left paper-lift">
          <p className="font-sans text-sage text-xs tracking-[0.2em] uppercase mb-1">
            You selected
          </p>
          <p className="font-serif text-palmetto text-2xl text-pressed">{selected.name}</p>
          {selected.party?.length > 1 && (
            <p className="font-sans text-sage text-xs mt-1">
              Party of {selected.party.length}
            </p>
          )}
          <button
            onClick={() => { setSelected(null); setTimeout(() => searchRef.current?.focus(), 50) }}
            className="font-sans text-xs text-sage hover:text-palmetto transition-colors mt-3 underline underline-offset-2"
          >
            Not you? Choose again
          </button>
        </div>
      ) : (
        <div className="mb-6 text-left">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50 text-sm mb-2"
          />
          <div className="max-h-60 overflow-y-auto rounded border border-sage/20 divide-y divide-sage/10">
            {filtered.length === 0 && (
              <p className="font-sans text-sage text-sm p-4 text-center">
                {search ? 'No matches found.' : 'No unclaimed guests.'}
              </p>
            )}
            {filtered.map(g => (
              <button
                key={g.id}
                onClick={() => setSelected(g)}
                className="w-full text-left px-4 py-3 font-sans text-sm text-palmetto hover:bg-sage/10 transition-colors flex items-center justify-between"
              >
                <span>{g.name}</span>
                {g.party?.length > 1 && (
                  <span className="text-sage text-xs">+{g.party.length - 1} guest{g.party.length - 1 !== 1 ? 's' : ''}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="font-sans text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleClaim}
        disabled={!selected || claiming}
        className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-8 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50 w-full"
      >
        {claiming ? 'Confirming…' : "That's me →"}
      </button>
    </div>
  )
}
