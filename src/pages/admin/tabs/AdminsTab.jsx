import { useState, useEffect } from 'react'
import { getAdminUids, addAdminUid, removeAdminUid } from '../../../hooks/useAdmins'

const ENV_UID = import.meta.env.VITE_ADMIN_UID

export default function AdminsTab() {
  const [uids, setUids] = useState([])
  const [loading, setLoading] = useState(true)
  const [newUid, setNewUid] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getAdminUids().then(setUids).finally(() => setLoading(false))
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const uid = newUid.trim()
    if (!uid) return
    if (uids.includes(uid)) { setError('That UID is already an admin.'); return }
    setAdding(true)
    setError('')
    try {
      await addAdminUid(uid)
      setUids(prev => [...prev, uid])
      setNewUid('')
      setSuccess('Admin added successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to add admin. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(uid) {
    if (!window.confirm('Remove this admin?')) return
    setRemoving(uid)
    try {
      await removeAdminUid(uid)
      setUids(prev => prev.filter(u => u !== uid))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-serif text-palmetto text-2xl mb-2 text-pressed">Admins</h2>
      <p className="font-sans text-sage text-xs mb-6 leading-relaxed">
        Add your fiancée's Firebase UID to grant her admin access. Find UIDs in the Firebase
        Console under Authentication → Users.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newUid}
          onChange={e => setNewUid(e.target.value)}
          placeholder="Firebase UID"
          className="flex-1 border border-sage/40 rounded px-4 py-2.5 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 font-mono"
        />
        <button
          type="submit"
          disabled={adding || !newUid.trim()}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2.5 px-5 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50 shrink-0"
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && <p className="font-sans text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="font-sans text-sage text-sm mb-4">{success}</p>}

      {loading ? (
        <p className="font-sans text-sage">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {uids.map(uid => (
            <div
              key={uid}
              className="flex items-center justify-between border border-sage/20 rounded-lg px-4 py-3 hover:bg-sage/5"
            >
              <div className="min-w-0 mr-4">
                <p className="font-mono text-palmetto text-sm truncate">{uid}</p>
                {uid === ENV_UID && (
                  <p className="font-sans text-sage/60 text-xs mt-0.5">
                    Primary admin · set via environment variable
                  </p>
                )}
              </div>
              {uid !== ENV_UID && (
                <button
                  onClick={() => handleRemove(uid)}
                  disabled={removing === uid}
                  className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
