import { useState, useEffect, useCallback } from 'react'
import { getAllVendors, addVendor, updateVendor, deleteVendor } from '../../../hooks/useVendors'

const CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Videography', 'Florist',
  'Music / DJ', 'Hair & Makeup', 'Officiant', 'Transportation',
  'Cake / Dessert', 'Other',
]

const EMPTY_FORM = {
  name: '', category: 'Other', contact: '',
  phone: '', email: '', website: '', notes: '',
}

function fieldClass() {
  return 'border border-sage/40 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 w-full'
}

function VendorFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, category: initial.category, contact: initial.contact ?? '',
          phone: initial.phone ?? '', email: initial.email ?? '',
          website: initial.website ?? '', notes: initial.notes ?? '' }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Vendor name is required.'); return }
    setSaving(true)
    try {
      await onSave(form)
    } catch {
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-paper rounded-lg w-full max-w-md p-6 shadow-2xl my-auto">
        <h3 className="font-serif text-palmetto text-xl mb-4">
          {initial ? 'Edit Vendor' : 'Add Vendor'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Vendor name *"
            className={fieldClass()}
          />
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className={fieldClass()}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            value={form.contact}
            onChange={e => set('contact', e.target.value)}
            placeholder="Contact person"
            className={fieldClass()}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="Phone"
              className={fieldClass()}
            />
            <input
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="Email"
              type="email"
              className={fieldClass()}
            />
          </div>
          <input
            value={form.website}
            onChange={e => set('website', e.target.value)}
            placeholder="Website URL"
            className={fieldClass()}
          />
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Notes — contract details, pricing, deadlines…"
            rows={3}
            className={`${fieldClass()} resize-none`}
          />
          {error && <p className="font-sans text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-xs tracking-widest uppercase text-sage hover:text-palmetto px-4 py-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorsTab() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editVendor, setEditVendor] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setVendors(await getAllVendors()) }
    catch { setError('Failed to load vendors.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    if (editVendor) {
      await updateVendor(editVendor.id, form)
    } else {
      await addVendor(form)
    }
    setEditVendor(null)
    setShowAdd(false)
    await load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this vendor?')) return
    setDeleting(id)
    try {
      await deleteVendor(id)
      setVendors(prev => prev.filter(v => v.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  // Group vendors by category, preserving CATEGORIES order
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const matches = vendors.filter(v => v.category === cat)
    if (matches.length) acc[cat] = matches
    return acc
  }, {})
  // Catch any vendors with unlisted categories
  const uncategorized = vendors.filter(v => !CATEGORIES.includes(v.category))
  if (uncategorized.length) grouped['Uncategorized'] = uncategorized

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-palmetto text-2xl text-pressed">Vendors</h2>
          <p className="font-sans text-sage text-xs mt-1">
            Private reference — not visible to guests.
          </p>
        </div>
        <button
          onClick={() => { setEditVendor(null); setShowAdd(true) }}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors"
        >
          + Add Vendor
        </button>
      </div>

      {(showAdd || editVendor) && (
        <VendorFormModal
          initial={editVendor}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditVendor(null) }}
        />
      )}

      {loading && <p className="font-sans text-sage text-center py-12">Loading…</p>}
      {error && <p className="font-sans text-red-500 text-center py-12">{error}</p>}
      {!loading && !error && vendors.length === 0 && (
        <p className="font-sans text-sage text-center py-12">No vendors yet.</p>
      )}

      {!loading && Object.entries(grouped).map(([cat, vns]) => (
        <div key={cat} className="mb-8">
          <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-sage/60 mb-3 border-b border-sage/10 pb-2">
            {cat}
          </h3>
          <div className="flex flex-col gap-2">
            {vns.map(v => (
              <div
                key={v.id}
                className="border border-sage/20 rounded-lg px-5 py-4 hover:bg-sage/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-serif text-palmetto">{v.name}</p>
                    {v.contact && (
                      <p className="font-sans text-sage text-xs mt-0.5">{v.contact}</p>
                    )}
                    <div className="flex gap-4 mt-1.5 flex-wrap">
                      {v.phone && (
                        <a href={`tel:${v.phone}`} className="font-sans text-xs text-sage hover:text-palmetto transition-colors">
                          {v.phone}
                        </a>
                      )}
                      {v.email && (
                        <a href={`mailto:${v.email}`} className="font-sans text-xs text-sage hover:text-palmetto transition-colors">
                          {v.email}
                        </a>
                      )}
                      {v.website && (
                        <a href={v.website} target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-sage hover:text-palmetto transition-colors">
                          Website ↗
                        </a>
                      )}
                    </div>
                    {v.notes && (
                      <p className="font-sans text-sage/70 text-xs mt-2 leading-relaxed">
                        {v.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => { setShowAdd(false); setEditVendor(v) }}
                      className="font-sans text-xs text-sage hover:text-palmetto uppercase tracking-widest transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={deleting === v.id}
                      className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
