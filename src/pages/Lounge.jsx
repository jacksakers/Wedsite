import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGuestIdentity } from '../context/GuestIdentityContext'
import { getAdminUids } from '../hooks/useAdmins'
import IdentityClaimFlow from '../components/lounge/IdentityClaimFlow'
import CoupleClaimFlow from '../components/lounge/CoupleClaimFlow'
import EditProfilePanel from '../components/lounge/EditProfilePanel'
import CoupleEditProfilePanel from '../components/lounge/CoupleEditProfilePanel'
import PolaroidWall from '../components/lounge/PolaroidWall'
import SocialSpace from '../components/lounge/social/SocialSpace'
import MixtapeSpace from '../components/lounge/mixtape/MixtapeSpace'
import PhotoVault from '../components/lounge/PhotoVault'

const TABS = [
  { value: 'wall',    label: "Who's Who" },
  { value: 'social',  label: 'Gathering' },
  { value: 'mixtape', label: 'Mixtape' },
  { value: 'photos',  label: 'Photos' },
]

export default function Lounge() {
  const { user } = useAuth()
  const { linkedGuest, identityLoading } = useGuestIdentity()
  const [searchParams, setSearchParams] = useSearchParams()
  const [wallKey, setWallKey] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // Resolve admin status once
  useEffect(() => {
    if (!user) return
    getAdminUids()
      .then(uids => setIsAdmin(uids.includes(user.uid)))
      .catch(() => {})
  }, [user])

  const activeTab = searchParams.get('tab') ?? 'social'

  function setTab(tab) {
    setSearchParams(prev => {
      prev.set('tab', tab)
      // Clear post/tag/guestId when switching tabs
      prev.delete('post')
      prev.delete('tag')
      prev.delete('guestId')
      return prev
    }, { replace: true })
  }

  const handleProfileSaved = useCallback(() => {
    setWallKey(k => k + 1)
  }, [])

  if (identityLoading) {
    return (
      <main className="min-h-[80svh] flex items-center justify-center bg-paper">
        <p className="font-sans text-sage text-sm">Loading…</p>
      </main>
    )
  }

  if (!linkedGuest) {
    return (
      <main className="bg-paper min-h-[80svh] px-6 py-20">
        {user?.isAnonymous === false ? <CoupleClaimFlow /> : <IdentityClaimFlow />}
      </main>
    )
  }

  const firstName = linkedGuest.name.split(' ')[0]
  const isCouple  = linkedGuest.isCouple === true

  return (
    <main className="bg-paper min-h-[80svh]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section className="bg-palmetto py-12 px-6 text-center velvet-surface">
        {isCouple ? (
          <p className="font-sans text-sunrise-pink text-xs tracking-[0.25em] uppercase mb-2">
            {linkedGuest.role === 'bride' ? '♡ The Bride ♡' : '♡ The Groom ♡'}
          </p>
        ) : (
          <p className="font-sans text-sunrise-pink text-xs tracking-[0.25em] uppercase mb-4">
            Welcome back
          </p>
        )}
        <h1 className={`font-serif text-paper text-5xl md:text-6xl text-gilt ${isCouple ? 'md:text-7xl' : ''}`}>
          {firstName}
        </h1>
        <p className="font-sans text-paper/50 text-xs tracking-[0.3em] uppercase mt-3">
          The Guest Lounge
        </p>
        {isCouple && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="block h-px w-10 bg-sunrise-pink/40" />
            <span className="font-sans text-sunrise-pink/70 text-xs tracking-[0.2em] uppercase">
              Your posts will be highlighted for guests
            </span>
            <span className="block h-px w-10 bg-sunrise-pink/40" />
          </div>
        )}

        {/* ── Subtabs ── */}
        <div className="flex items-center gap-1 mt-8 overflow-x-auto px-4 pb-1 justify-start sm:justify-center no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTab(tab.value)}
              className={`flex-shrink-0 px-4 sm:px-5 py-2 rounded-full font-sans text-xs tracking-[0.15em] uppercase transition-all ${
                activeTab === tab.value
                  ? 'bg-paper text-palmetto'
                  : 'text-paper/60 hover:text-paper'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── The Gathering (social space) ───────────────────────────────────── */}
      {activeTab === 'social' && (
        <SocialSpace
          currentGuest={linkedGuest}
          currentUser={user}
          isAdmin={isAdmin || isCouple}
        />
      )}

      {/* ── The Mixtape ─────────────────────────────────────────────────────── */}
      {activeTab === 'mixtape' && (
        <MixtapeSpace
          currentGuest={linkedGuest}
          currentUser={user}
          isAdmin={isAdmin || isCouple}
        />
      )}
      {/* ── Photo Vault (Photo Upload) ───────────────────────────── */}
      {activeTab === 'photos' && (
        <PhotoVault
          currentGuest={linkedGuest}
          currentUser={user}
          isAdmin={isAdmin || isCouple}
        />
      )}
      {/* ── Who's Who wall ─────────────────────────────────────────────────── */}
      {activeTab === 'wall' && (
        <section className="py-10 px-6">
          <div className="max-w-5xl mx-auto">

            {/* ── Your intro card ── */}
            <div className="max-w-xl mx-auto mb-12">
              <div className={`border rounded-lg p-6 paper-lift ${isCouple ? 'border-sunrise-pink/20 bg-palmetto/5' : 'border-sage/20'}`}>
                <div className="mb-5">
                  <h3 className="font-serif text-palmetto text-lg text-pressed">Your intro</h3>
                  <p className="font-sans text-sage text-xs tracking-[0.1em] mt-0.5">
                    {isCouple
                      ? 'Write a note and add your photo — your card will appear at the top of the wall'
                      : "This is how you'll appear on the wall"}
                  </p>
                </div>
                {isCouple
                  ? <CoupleEditProfilePanel guest={linkedGuest} onSaved={handleProfileSaved} />
                  : <EditProfilePanel       guest={linkedGuest} onSaved={handleProfileSaved} />
                }
              </div>
            </div>

            {/* ── The wall ── */}
            <PolaroidWall
              key={wallKey}
              currentGuestId={linkedGuest?.id}
              onEditProfile={() => {}}
            />
          </div>
        </section>
      )}

    </main>
  )
}
