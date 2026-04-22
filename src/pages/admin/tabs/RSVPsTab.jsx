import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase'

const TABLE_HEADERS = ['Guest', 'Party Member', 'Attending', 'Song Request', 'Notes', 'Phone', 'Mailing Address', '']

function exportToCSV(rsvps) {
  const rows = [['Guest', 'Party Member', 'Attending', 'Song Request', 'Notes', 'Phone', 'Mailing Address', 'Submitted']]
  rsvps.forEach(r => {
    const address = [r.addressLine1, r.addressCity, r.addressState, r.addressZip].filter(Boolean).join(', ')
    ;(r.partyAttendance ?? []).forEach((p, i) => {
      rows.push([
        i === 0 ? r.guestName : '',
        p.name,
        p.attending ? 'Yes' : 'No',
        i === 0 ? r.songRequest || '' : '',
        i === 0 ? r.notes || '' : '',
        i === 0 ? r.phone || '' : '',
        i === 0 ? address : '',
        i === 0 ? (r.submittedAt?.toDate?.().toLocaleDateString() ?? '') : '',
      ])
    })
  })
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'rsvps.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function RSVPsTab() {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const q = query(collection(db, 'rsvps'), orderBy('submittedAt', 'desc'))
      const snap = await getDocs(q)
      setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch {
      setError('Failed to load RSVPs. Check your Firestore rules.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this RSVP response? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'rsvps', id))
      setRsvps(prev => prev.filter(r => r.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const allMembers = rsvps.flatMap(r => r.partyAttendance ?? [])
  const attending = allMembers.filter(p => p.attending).length
  const declined = allMembers.filter(p => p.attending === false).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-palmetto text-2xl text-pressed">RSVPs</h2>
        {rsvps.length > 0 && (
          <button
            onClick={() => exportToCSV(rsvps)}
            className="font-sans text-xs tracking-[0.2em] uppercase border border-sage/40 text-sage px-4 py-2 rounded hover:border-sage hover:text-palmetto transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[['Attending', attending], ['Declined', declined], ['Responses', rsvps.length]].map(
          ([label, value]) => (
            <div key={label} className="bg-sage/10 border border-sage/20 rounded px-6 py-4 text-center">
              <p className="font-serif text-palmetto text-3xl">{value}</p>
              <p className="font-sans text-xs tracking-widest uppercase text-sage mt-1">{label}</p>
            </div>
          )
        )}
      </div>

      {loading && <p className="font-sans text-sage text-center py-12">Loading RSVPs…</p>}
      {error && <p className="font-sans text-red-500 text-center py-12">{error}</p>}
      {!loading && !error && rsvps.length === 0 && (
        <p className="font-sans text-sage text-center py-12">No RSVPs yet.</p>
      )}
      {!loading && rsvps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sage/20">
                {TABLE_HEADERS.map(h => (
                  <th key={h} className="font-sans text-xs tracking-[0.15em] uppercase text-sage/60 pb-3 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rsvps.map(rsvp =>
                (rsvp.partyAttendance ?? []).map((p, i) => (
                  <tr key={`${rsvp.id}-${i}`} className="border-b border-sage/10 hover:bg-sage/5">
                    <td className="font-serif text-palmetto py-3 pr-4 whitespace-nowrap">
                      {i === 0 ? rsvp.guestName : ''}
                    </td>
                    <td className="font-sans text-sage text-sm py-3 pr-4 whitespace-nowrap">{p.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-sans text-xs tracking-wide uppercase px-2 py-0.5 rounded-full ${
                        p.attending ? 'bg-sage/20 text-palmetto' : 'bg-sunrise-pink/30 text-palmetto'
                      }`}>
                        {p.attending ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="font-sans text-sage text-sm py-3 pr-4">{i === 0 ? rsvp.songRequest || '—' : ''}</td>
                    <td className="font-sans text-sage text-sm py-3 pr-4">{i === 0 ? rsvp.notes || '—' : ''}</td>
                    <td className="font-sans text-sage text-sm py-3 pr-4 whitespace-nowrap">{i === 0 ? rsvp.phone || '—' : ''}</td>
                    <td className="font-sans text-sage text-sm py-3 pr-4">
                      {i === 0
                        ? [rsvp.addressLine1, rsvp.addressCity, rsvp.addressState, rsvp.addressZip].filter(Boolean).join(', ') || '—'
                        : ''}
                    </td>
                    <td className="py-3">
                      {i === 0 && (
                        <button
                          onClick={() => handleDelete(rsvp.id)}
                          disabled={deleting === rsvp.id}
                          className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
