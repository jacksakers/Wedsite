import { useState, useEffect } from 'react'
import { getAllGuestProfiles } from '../../hooks/useGuestProfiles'
import GuestPolaroidCard from './GuestPolaroidCard'
import CouplePolaroidCard from './CouplePolaroidCard'

export default function PolaroidWall({ currentGuestId, onEditProfile }) {
  const [profiles, setProfiles]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    getAllGuestProfiles()
      .then(setProfiles)
      .catch(() => setError('Could not load the wall. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-sans text-sage text-sm">Loading the wall…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="font-sans text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  const coupleProfiles = profiles.filter(p => p.isCouple)
  const guestProfiles  = profiles.filter(p => !p.isCouple)

  // Stable bride-first sort so the two cards always lean toward each other
  const sortedCouple = [...coupleProfiles].sort((a, b) => {
    const order = { bride: 0, groom: 1 }
    return (order[a.coupleRole] ?? 2) - (order[b.coupleRole] ?? 2)
  })

  const hasAny = profiles.length > 0

  if (!hasAny) {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-palmetto text-xl mb-2 text-pressed">Be the first!</p>
        <p className="font-sans text-sage text-sm">
          No one has introduced themselves yet. Add your photo above to kick things off.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16">

      {/* ── Couple feature row ── */}
      {sortedCouple.length > 0 && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <span className="flex-1 h-px bg-sage/20" />
            <span className="font-sans text-sage/40 text-[9px] tracking-[0.3em] uppercase">the happy couple</span>
            <span className="flex-1 h-px bg-sage/20" />
          </div>
          <div className="flex flex-wrap justify-center" style={{ gap: '2rem 3rem' }}>
            {sortedCouple.map(profile => (
              <CouplePolaroidCard
                key={profile.id}
                profile={profile}
                isOwn={profile.id === currentGuestId}
                onEdit={onEditProfile}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Guest wall ── */}
      {guestProfiles.length > 0 && (
        <div className="flex flex-col items-center gap-8">
          {sortedCouple.length > 0 && (
            <div className="flex items-center gap-3 w-full max-w-xs">
              <span className="flex-1 h-px bg-sage/20" />
              <span className="font-sans text-sage/40 text-[9px] tracking-[0.3em] uppercase">your fellow guests</span>
              <span className="flex-1 h-px bg-sage/20" />
            </div>
          )}
          <div className="flex flex-wrap justify-center" style={{ gap: '2.5rem 2rem' }}>
            {guestProfiles.map(profile => (
              <GuestPolaroidCard
                key={profile.id}
                profile={profile}
                isOwn={profile.id === currentGuestId}
                onEdit={onEditProfile}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
