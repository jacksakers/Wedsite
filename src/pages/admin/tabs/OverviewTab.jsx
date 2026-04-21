import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'

function StatCard({ label, value }) {
  return (
    <div className="bg-sage/10 border border-sage/20 rounded-lg p-6 text-center">
      <p className="font-serif text-palmetto text-4xl mb-1">{value}</p>
      <p className="font-sans text-xs tracking-[0.2em] uppercase text-sage">{label}</p>
    </div>
  )
}

export default function OverviewTab() {
  const [stats, setStats] = useState({ responses: 0, attending: 0, declined: 0, invited: 0 })
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const [savedAnnouncement, setSavedAnnouncement] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [rsvpSnap, guestSnap, annSnap] = await Promise.all([
          getDocs(query(collection(db, 'rsvps'), orderBy('submittedAt', 'desc'))),
          getDocs(collection(db, 'guests')),
          getDoc(doc(db, 'config', 'announcement')),
        ])
        const allMembers = rsvpSnap.docs.flatMap(d => d.data().partyAttendance ?? [])
        setStats({
          responses: rsvpSnap.size,
          attending: allMembers.filter(p => p.attending).length,
          declined: allMembers.filter(p => p.attending === false).length,
          invited: guestSnap.size,
        })
        if (annSnap.exists()) {
          const msg = annSnap.data().message ?? ''
          setAnnouncement(msg)
          setSavedAnnouncement(msg)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveAnnouncement() {
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'announcement'), { message: announcement })
      setSavedAnnouncement(announcement)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="font-sans text-sage text-center py-20">Loading…</p>

  return (
    <div>
      <h2 className="font-serif text-palmetto text-2xl mb-6 text-pressed">Overview</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard label="Invited" value={stats.invited} />
        <StatCard label="Responses" value={stats.responses} />
        <StatCard label="Attending" value={stats.attending} />
        <StatCard label="Declined" value={stats.declined} />
      </div>

      {/* Response rate bar */}
      {stats.invited > 0 && (
        <div className="mb-12">
          <div className="flex justify-between font-sans text-xs text-sage uppercase tracking-widest mb-2">
            <span>Response Rate</span>
            <span>{Math.round((stats.responses / stats.invited) * 100)}%</span>
          </div>
          <div className="h-2 bg-sage/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.responses / stats.invited) * 100)}%` }}
            />
          </div>
          <p className="font-sans text-sage/50 text-xs mt-1 text-right">
            {stats.responses} of {stats.invited} groups responded
          </p>
        </div>
      )}

      {/* Guest Announcement */}
      <div className="border border-sage/20 rounded-lg p-6">
        <h3 className="font-serif text-palmetto text-xl mb-1">Guest Announcement</h3>
        <p className="font-sans text-sage text-xs mb-4">
          Displayed to guests on the access page after entering their passcode. Leave blank to hide.
        </p>
        <textarea
          value={announcement}
          onChange={e => setAnnouncement(e.target.value)}
          rows={3}
          placeholder="e.g. Shuttle service departs the Marriott at 2:30 PM sharp — don't be late!"
          className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50 resize-none text-sm mb-3"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={saveAnnouncement}
            disabled={saving || announcement === savedAnnouncement}
            className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saveMsg && <span className="font-sans text-sage text-sm">{saveMsg}</span>}
        </div>
      </div>
    </div>
  )
}
