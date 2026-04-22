import { useState, useEffect, useCallback } from 'react'
import { getAllGuests, addGuest, updateGuest, deleteGuest, resetGuestUid } from '../../../hooks/useGuests'

const EMPTY_FORM = { party: [{ name: '' }] }

function PartyMemberInputs({ members, onChange }) {
  function updateMember(idx, val) {
    const next = [...members]
    next[idx] = { name: val }
    onChange(next)
  }

  function addMember() {
    onChange([...members, { name: '' }])
  }

  function removeMember(idx) {
    onChange(members.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((m, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={m.name}
            onChange={e => updateMember(i, e.target.value)}
            placeholder={i === 0 ? 'Primary guest name *' : 'Additional party member'}
            className="flex-1 border border-sage/40 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          {i > 0 && (
            <button
              type="button"
              onClick={() => removeMember(i)}
              className="text-red-400 hover:text-red-600 text-lg leading-none px-1 transition-colors"
              aria-label="Remove member"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addMember}
        className="font-sans text-xs text-sage hover:text-palmetto uppercase tracking-widest text-left mt-1 transition-colors"
      >
        + Add party member
      </button>
    </div>
  )
}

function GuestFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { party: initial.party.map(p => ({ name: p.name })) }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const primaryName = form.party[0]?.name?.trim()
    if (!primaryName) { setError('Primary guest name is required.'); return }
    const party = form.party
      .filter(p => p.name.trim())
      .map(p => ({ name: p.name.trim() }))
    setSaving(true)
    setError('')
    try {
      await onSave({ name: primaryName, party })
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-paper rounded-lg w-full max-w-md p-6 shadow-2xl">
        <h3 className="font-serif text-palmetto text-xl mb-4">
          {initial ? 'Edit Guest' : 'Add Guest'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PartyMemberInputs
            members={form.party}
            onChange={party => setForm({ party })}
          />
          {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-xs tracking-widest uppercase text-sage hover:text-palmetto transition-colors px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GuestListTab() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editGuest, setEditGuest] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [resetting, setResetting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setGuests(await getAllGuests())
    } catch {
      setError('Failed to load guests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(data) {
    if (editGuest) {
      await updateGuest(editGuest.id, data)
    } else {
      await addGuest(data)
    }
    setEditGuest(null)
    setShowAdd(false)
    await load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this guest from the invited list?')) return
    setDeleting(id)
    try {
      await deleteGuest(id)
      setGuests(prev => prev.filter(g => g.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleResetClaim(id) {
    if (!window.confirm('Reset this guest\'s device link? They will need to re-select their name on their next visit.')) return
    setResetting(id)
    try {
      await resetGuestUid(id)
      setGuests(prev => prev.map(g => g.id === id ? { ...g, linkedUid: null } : g))
    } finally {
      setResetting(null)
    }
  }

  const totalPeople = guests.reduce((sum, g) => sum + (g.party?.length ?? 1), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-palmetto text-2xl text-pressed">Guest List</h2>
          <p className="font-sans text-sage text-xs mt-1">
            {guests.length} group{guests.length !== 1 ? 's' : ''} · {totalPeople} people invited
          </p>
        </div>
        <button
          onClick={() => { setEditGuest(null); setShowAdd(true) }}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors"
        >
          + Add Guest
        </button>
      </div>

      {(showAdd || editGuest) && (
        <GuestFormModal
          initial={editGuest}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditGuest(null) }}
        />
      )}

      {loading && <p className="font-sans text-sage text-center py-12">Loading guests…</p>}
      {error && <p className="font-sans text-red-500 text-center py-12">{error}</p>}
      {!loading && !error && guests.length === 0 && (
        <p className="font-sans text-sage text-center py-12">
          No guests yet. Add your first guest to get started.
        </p>
      )}
      {!loading && guests.length > 0 && (
        <div className="flex flex-col gap-2">
          {guests.map(guest => (
            <div
              key={guest.id}
              className="border border-sage/20 rounded-lg px-5 py-4 flex items-start justify-between hover:bg-sage/5 transition-colors"
            >
              <div>
                <p className="font-serif text-palmetto">{guest.name}</p>
                {guest.party?.length > 1 && (
                  <p className="font-sans text-sage text-xs mt-0.5">
                    + {guest.party.slice(1).map(p => p.name).join(', ')}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <p className="font-sans text-sage/50 text-xs">
                    {guest.party?.length ?? 1} {guest.party?.length === 1 ? 'person' : 'people'}
                  </p>
                  {guest.linkedUid ? (
                    <span className="font-sans text-palmetto/50 text-[10px] tracking-widest uppercase">✓ linked</span>
                  ) : (
                    <span className="font-sans text-sage/30 text-[10px] tracking-widest uppercase">not linked</span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 ml-4 shrink-0 pt-0.5">
                <button
                  onClick={() => { setShowAdd(false); setEditGuest(guest) }}
                  className="font-sans text-xs text-sage hover:text-palmetto uppercase tracking-widest transition-colors"
                >
                  Edit
                </button>
                {guest.linkedUid && (
                  <button
                    onClick={() => handleResetClaim(guest.id)}
                    disabled={resetting === guest.id}
                    className="font-sans text-xs text-sage/50 hover:text-sunrise-orange transition-colors disabled:opacity-50"
                    title="Reset device link so this guest can re-claim from any device"
                  >
                    Reset link
                  </button>
                )}
                <button
                  onClick={() => handleDelete(guest.id)}
                  disabled={deleting === guest.id}
                  className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
