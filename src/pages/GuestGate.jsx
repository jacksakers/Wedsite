import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase'

// VITE_ env vars are bundled client-side. Security against data access
// is enforced by Firestore rules (require auth), not by this passcode alone.
const PASSCODE = import.meta.env.VITE_GUEST_PASSCODE

export default function GuestGate() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    if (code.trim() !== PASSCODE) {
      setError("That code doesn't match. Please check your Save the Date.")
      return
    }
    setLoading(true)
    try {
      await signInAnonymously(auth)
      navigate(from, { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80svh] flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-md text-center">
        <p className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase mb-4">
          Welcome
        </p>
        <h1 className="font-serif text-palmetto text-4xl mb-4">Guest Access</h1>
        <p className="font-sans text-sage text-sm leading-relaxed mb-10">
          Please enter the passcode from your Save the Date to continue.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter passcode"
            className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto text-center tracking-widest bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
            autoCapitalize="none"
            autoComplete="off"
          />
          {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </main>
  )
}
