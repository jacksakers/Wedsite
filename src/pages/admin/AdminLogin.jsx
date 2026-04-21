import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { COUPLE_DISPLAY } from '../../constants/weddingInfo'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80svh] flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-palmetto text-3xl text-center mb-2 text-pressed">Admin Sign In</h1>
        <p className="font-sans text-sage text-xs text-center tracking-widest uppercase mb-8">
          {COUPLE_DISPLAY}'s Wedding
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}
