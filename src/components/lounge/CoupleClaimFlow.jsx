import { useState } from 'react'
import { useGuestIdentity } from '../../context/GuestIdentityContext'

const ROLES = [
  { value: 'bride', label: 'The Bride' },
  { value: 'groom', label: 'The Groom' },
]

export default function CoupleClaimFlow() {
  const { claimCoupleIdentity } = useGuestIdentity()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !role) return
    setError('')
    setSaving(true)
    try {
      await claimCoupleIdentity({ name: name.trim(), role })
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <p className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase mb-3">
        Welcome
      </p>
      <h2 className="font-serif text-palmetto text-4xl mb-4 text-pressed">
        It's you!
      </h2>
      <p className="font-sans text-sage text-sm leading-relaxed mb-10">
        Just tell us who you are so your presence in the Lounge is a little special.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your first name"
          className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto text-center bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
          autoComplete="off"
        />

        <div className="flex gap-3">
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex-1 py-3 rounded font-sans text-xs tracking-[0.2em] uppercase transition-colors border ${
                role === r.value
                  ? 'bg-palmetto text-paper border-palmetto'
                  : 'bg-paper text-sage border-sage/40 hover:border-sage'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <p className="font-sans text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!name.trim() || !role || saving}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-8 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </form>
    </div>
  )
}
