import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../../firebase'

function StatCard({ label, value }) {
  return (
    <div className="bg-sage/10 border border-sage/20 rounded-lg p-6 text-center">
      <p className="font-serif text-palmetto text-4xl mb-1">{value}</p>
      <p className="font-sans text-xs tracking-[0.2em] uppercase text-sage">{label}</p>
    </div>
  )
}

const TABLE_HEADERS = ['Guest', 'Party Member', 'Attending', 'Meal', 'Song Request', 'Notes']

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchRsvps() {
      try {
        const q = query(collection(db, 'rsvps'), orderBy('submittedAt', 'desc'))
        const snap = await getDocs(q)
        setRsvps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {
        setFetchError('Failed to load RSVPs. Check your Firestore rules.')
      } finally {
        setLoading(false)
      }
    }
    fetchRsvps()
  }, [])

  async function handleSignOut() {
    await signOut(auth)
    navigate('/')
  }

  const allPartyMembers = rsvps.flatMap(r => r.partyAttendance ?? [])
  const attending = allPartyMembers.filter(p => p.attending).length
  const declined = allPartyMembers.filter(p => p.attending === false).length

  return (
    <main className="bg-paper min-h-svh">
      <div className="bg-palmetto py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-paper text-3xl">Admin Dashboard</h1>
            <p className="font-sans text-paper/50 text-xs mt-1">
              {rsvps.length} response{rsvps.length !== 1 ? 's' : ''} received
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="font-sans text-xs tracking-widest uppercase text-paper/70 border border-paper/30 rounded px-4 py-2 hover:text-paper hover:border-paper transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="grid grid-cols-3 gap-4 mb-12">
          <StatCard label="Attending" value={attending} />
          <StatCard label="Declined" value={declined} />
          <StatCard label="Responses" value={rsvps.length} />
        </div>

        {loading && (
          <p className="font-sans text-sage text-center py-12">Loading RSVPs…</p>
        )}
        {fetchError && (
          <p className="font-sans text-red-500 text-center py-12">{fetchError}</p>
        )}
        {!loading && !fetchError && rsvps.length === 0 && (
          <p className="font-sans text-sage text-center py-12">No RSVPs yet.</p>
        )}
        {!loading && rsvps.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sage/20">
                  {TABLE_HEADERS.map(h => (
                    <th
                      key={h}
                      className="font-sans text-xs tracking-[0.15em] uppercase text-sage/60 pb-3 pr-4 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rsvps.map(rsvp =>
                  (rsvp.partyAttendance ?? []).map((p, i) => (
                    <tr
                      key={`${rsvp.id}-${i}`}
                      className="border-b border-sage/10 hover:bg-sage/5"
                    >
                      <td className="font-serif text-palmetto py-3 pr-4 whitespace-nowrap">
                        {i === 0 ? rsvp.guestName : ''}
                      </td>
                      <td className="font-sans text-sage text-sm py-3 pr-4 whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`font-sans text-xs tracking-wide uppercase px-2 py-0.5 rounded-full ${
                            p.attending
                              ? 'bg-sage/20 text-palmetto'
                              : 'bg-sunrise-pink/30 text-palmetto'
                          }`}
                        >
                          {p.attending ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="font-sans text-sage text-sm py-3 pr-4">{p.meal || '—'}</td>
                      <td className="font-sans text-sage text-sm py-3 pr-4">
                        {i === 0 ? rsvp.songRequest || '—' : ''}
                      </td>
                      <td className="font-sans text-sage text-sm py-3">
                        {i === 0 ? rsvp.notes || '—' : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
