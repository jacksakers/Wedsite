import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAllGuests,
  saveGuestGroup,
  deleteGuestGroup,
  resetGuestUid,
  groupGuestsByHousehold,
  migrateLegacyGuests,
} from '../../../hooks/useGuests'
import GuestImportExport from './GuestImportExport'

const RSVP_OPTIONS = ['', 'Accepted', 'Declined', 'Pending']
const EMPTY_FORM = { party: [{ guestId: null, name: '' }], address: '', phone: '', rsvpStatus: '', notes: '' }

function PartyMemberInputs({ members, onChange }) {
  function updateMember(idx, val) {
    const next = [...members]
    next[idx] = { ...next[idx], name: val }
    onChange(next)
  }

  function addMember() {
    onChange([...members, { guestId: null, name: '' }])
  }

  function removeMember(idx) {
    onChange(members.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member, index) => (
        <div key={member.guestId ?? index} className="flex gap-2 items-center">
          <input
            value={member.name}
            onChange={e => updateMember(index, e.target.value)}
            placeholder={index === 0 ? 'Primary guest name *' : 'Additional group member'}
            className="flex-1 border border-sage/40 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          {index > 0 && (
            <button
              type="button"
              onClick={() => removeMember(index)}
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
        + Add group member
      </button>
    </div>
  )
}

function GuestFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          party: initial.members.map(member => ({ guestId: member.id, name: member.name })),
          address: initial.address ?? '',
          phone: initial.phone ?? '',
          rsvpStatus: initial.rsvpStatus ?? '',
          notes: initial.notes ?? '',
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key, val) {
    setForm(current => ({ ...current, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const party = form.party
      .map(member => ({
        guestId: member.guestId ?? null,
        name: member.name.trim(),
      }))
      .filter(member => member.name)

    if (party.length === 0) {
      setError('At least one guest name is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave({
        party,
        address: form.address.trim(),
        phone: form.phone.trim(),
        rsvpStatus: form.rsvpStatus.trim(),
        notes: form.notes.trim(),
      })
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const fieldClass = 'border border-sage/40 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 w-full'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto mt-16">
      <div className="flex min-h-full items-start justify-center p-4">
        <div className="bg-paper rounded-lg w-full max-w-md p-6 shadow-2xl my-16 sm:my-8">
          <h3 className="font-serif text-palmetto text-xl mb-4">
            {initial ? 'Edit Group' : 'Add Group'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PartyMemberInputs
              members={form.party}
              onChange={party => set('party', party)}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Address"
                className={fieldClass}
              />
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="Phone"
                className={fieldClass}
              />
            </div>
            <select
              value={form.rsvpStatus}
              onChange={e => set('rsvpStatus', e.target.value)}
              className={fieldClass}
            >
              {RSVP_OPTIONS.map(option => (
                <option key={option} value={option}>{option || '— RSVP status —'}</option>
              ))}
            </select>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notes (role, dietary needs, etc.)"
              rows={2}
              className={`${fieldClass} resize-none`}
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
    </div>
  )
}

export default function GuestListTab() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editGroup, setEditGroup] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [resetting, setResetting] = useState(null)
  const [migrating, setMigrating] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  const load = useCallback(async ({ showSpinner = true } = {}) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      setGuests(await getAllGuests())
    } catch {
      setError('Failed to load guests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const nextGuests = await getAllGuests()
        if (!active) return
        setGuests(nextGuests)
      } catch {
        if (active) setError('Failed to load guests.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const groups = useMemo(() => groupGuestsByHousehold(guests), [guests])
  const legacyGroups = groups.filter(group => group.isLegacy)
  const totalPeople = guests.length

  async function handleSave(data) {
    await saveGuestGroup(editGroup, data)
    setEditGroup(null)
    setShowAdd(false)
    await load()
  }

  async function handleDelete(group) {
    if (!window.confirm('Remove this entire group from the invited list?')) return
    setDeleting(group.id)
    try {
      await deleteGuestGroup(group)
      setGuests(prev => prev.filter(guest => guest.groupId !== group.id && guest.id !== group.id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleResetClaim(member) {
    if (!window.confirm('Reset this guest’s device link? They will need to re-select their name on their next visit.')) return
    setResetting(member.id)
    try {
      await resetGuestUid(member.id)
      setGuests(prev => prev.map(guest => guest.id === member.id ? { ...guest, linkedUid: null } : guest))
    } finally {
      setResetting(null)
    }
  }

  async function handleMigrateLegacy() {
    setMigrating(true)
    try {
      await migrateLegacyGuests()
      await load()
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-palmetto text-2xl text-pressed">Guest List</h2>
          <p className="font-sans text-sage text-xs mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''} · {totalPeople} people invited
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportExport(true)}
            className="font-sans text-xs tracking-[0.2em] uppercase py-2 px-4 rounded border border-sage/40 text-sage hover:text-palmetto hover:border-palmetto transition-colors"
          >
            Import / Export
          </button>
          <button
            onClick={() => { setEditGroup(null); setShowAdd(true) }}
            className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors"
          >
            + Add Group
          </button>
        </div>
      </div>

      {legacyGroups.length > 0 && (
        <div className="mb-6 rounded-lg border border-sunrise-orange/30 bg-sunrise-orange/10 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-palmetto text-lg">Legacy guest records found</p>
            <p className="font-sans text-sage text-sm mt-1">
              {legacyGroups.length} group{legacyGroups.length !== 1 ? 's still use' : ' still uses'} the old one-login-per-group format.
              Migrate them once so each guest can sign in and RSVP individually.
            </p>
          </div>
          <button
            onClick={handleMigrateLegacy}
            disabled={migrating}
            className="shrink-0 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
          >
            {migrating ? 'Migrating…' : 'Migrate'}
          </button>
        </div>
      )}

      {(showAdd || editGroup) && (
        <GuestFormModal
          initial={editGroup}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditGroup(null) }}
        />
      )}

      {showImportExport && (
        <GuestImportExport
          groups={groups}
          onImportComplete={load}
          onClose={() => setShowImportExport(false)}
        />
      )}

      {loading && <p className="font-sans text-sage text-center py-12">Loading guests…</p>}
      {error && <p className="font-sans text-red-500 text-center py-12">{error}</p>}
      {!loading && !error && groups.length === 0 && (
        <p className="font-sans text-sage text-center py-12">
          No guests yet. Add your first group to get started.
        </p>
      )}
      {!loading && groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.map(group => (
            <div
              key={group.id}
              className="border border-sage/20 rounded-lg px-5 py-4 flex items-start justify-between hover:bg-sage/5 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-serif text-palmetto">{group.name}</p>
                  {group.rsvpStatus && (
                    <span className={`font-sans text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      group.rsvpStatus === 'Accepted' ? 'bg-palmetto/10 text-palmetto' :
                      group.rsvpStatus === 'Declined' ? 'bg-red-100 text-red-400' :
                      'bg-sage/10 text-sage'
                    }`}>{group.rsvpStatus}</span>
                  )}
                  {group.isLegacy && (
                    <span className="font-sans text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-sunrise-orange/10 text-sunrise-orange">
                      Legacy
                    </span>
                  )}
                </div>
                <p className="font-sans text-sage text-xs mt-0.5">
                  {group.party.map(member => member.name).join(' · ')}
                </p>
                {(group.address || group.phone) && (
                  <p className="font-sans text-sage/60 text-xs mt-0.5 truncate">
                    {[group.address, group.phone].filter(Boolean).join(' · ')}
                  </p>
                )}
                {group.notes && (
                  <p className="font-sans text-sage/50 text-xs mt-0.5 italic truncate">{group.notes}</p>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  {group.members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 flex-wrap">
                      <p className="font-sans text-xs text-palmetto">{member.name}</p>
                      {member.linkedUid ? (
                        <>
                          <span className="font-sans text-palmetto/50 text-[10px] tracking-widest uppercase">✓ linked</span>
                          <button
                            onClick={() => handleResetClaim(member)}
                            disabled={resetting === member.id}
                            className="font-sans text-xs text-sage/50 hover:text-sunrise-orange transition-colors disabled:opacity-50"
                            title="Reset device link so this guest can re-claim from any device"
                          >
                            Reset link
                          </button>
                        </>
                      ) : (
                        <span className="font-sans text-sage/30 text-[10px] tracking-widest uppercase">not linked</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 ml-4 shrink-0 pt-0.5">
                <button
                  onClick={() => { setShowAdd(false); setEditGroup(group) }}
                  className="font-sans text-xs text-sage hover:text-palmetto uppercase tracking-widest transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(group)}
                  disabled={deleting === group.id}
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
