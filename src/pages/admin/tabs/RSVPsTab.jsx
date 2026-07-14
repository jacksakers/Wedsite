import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase'

const TABLE_HEADERS = ['Guest', 'Response', 'Notes', 'Phone', 'Mailing Address', 'Submitted', '']

function exportToCSV(rsvps) {
  const rows = [['Guest', 'Response', 'Notes', 'Phone', 'Mailing Address', 'Submitted']]
  rsvps.forEach(rsvp => {
    rows.push([
      rsvp.guestName,
      rsvp.attending ? 'Yes' : 'No',
      rsvp.notes || '',
      rsvp.phone || '',
      [rsvp.addressLine1, rsvp.addressCity, rsvp.addressState, rsvp.addressZip].filter(Boolean).join(', '),
      rsvp.submittedAt?.toDate?.().toLocaleDateString() ?? '',
    ])
  })
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = 'rsvps.csv'
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

export default function RSVPsTab() {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const q = query(collection(db, 'rsvps'), orderBy('submittedAt', 'desc'))
        const snap = await getDocs(q)
        if (active) setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {
        if (active) setError('Failed to load RSVPs. Check your Firestore rules.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this RSVP response? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'rsvps', id))
      setRsvps(prev => prev.filter(rsvp => rsvp.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const attending = rsvps.filter(rsvp => rsvp.attending).length
  const declined = rsvps.filter(rsvp => rsvp.attending === false).length

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
                {TABLE_HEADERS.map(header => (
                  <th key={header} className="font-sans text-xs tracking-[0.15em] uppercase text-sage/60 pb-3 pr-4 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rsvps.map(rsvp => (
                <tr key={rsvp.id} className="border-b border-sage/10 hover:bg-sage/5">
                  <td className="font-serif text-palmetto py-3 pr-4 whitespace-nowrap">{rsvp.guestName}</td>
                  <td className="py-3 pr-4">
                    <span className={`font-sans text-xs tracking-wide uppercase px-2 py-0.5 rounded-full ${
                      rsvp.attending ? 'bg-sage/20 text-palmetto' : 'bg-sunrise-pink/30 text-palmetto'
                    }`}>
                      {rsvp.attending ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="font-sans text-sage text-sm py-3 pr-4">{rsvp.notes || '—'}</td>
                  <td className="font-sans text-sage text-sm py-3 pr-4 whitespace-nowrap">{rsvp.phone || '—'}</td>
                  <td className="font-sans text-sage text-sm py-3 pr-4">
                    {[rsvp.addressLine1, rsvp.addressCity, rsvp.addressState, rsvp.addressZip].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="font-sans text-sage text-sm py-3 pr-4 whitespace-nowrap">
                    {rsvp.submittedAt?.toDate?.().toLocaleDateString() ?? '—'}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(rsvp.id)}
                      disabled={deleting === rsvp.id}
                      className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
