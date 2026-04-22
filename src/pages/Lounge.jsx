import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGuestIdentity } from '../context/GuestIdentityContext'
import IdentityClaimFlow from '../components/lounge/IdentityClaimFlow'
import CoupleClaimFlow from '../components/lounge/CoupleClaimFlow'
import EditProfilePanel from '../components/lounge/EditProfilePanel'
import CoupleEditProfilePanel from '../components/lounge/CoupleEditProfilePanel'
import PolaroidWall from '../components/lounge/PolaroidWall'

const COMING_SOON = [
  {
    title: 'The Social Feed',
    description: 'Leave notes for the couple, post photos, and interact with fellow guests.',
  },
  {
    title: 'Crowdsourced Mixtape',
    description: 'Add your song requests and upvote other picks to help build the perfect reception playlist.',
  },
  {
    title: 'Photo Vault',
    description: 'Upload your candid shots from the reception and browse the full shared gallery.',
  },
]

export default function Lounge() {
  const { user } = useAuth()
  const { linkedGuest, identityLoading } = useGuestIdentity()
  // wallKey forces PolaroidWall to re-fetch after the user saves their profile
  const [wallKey, setWallKey] = useState(0)

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
      <section className="bg-palmetto py-16 px-6 text-center velvet-surface">
        {isCouple && (
          <p className="font-sans text-sunrise-pink text-xs tracking-[0.25em] uppercase mb-2">
            {linkedGuest.role === 'bride' ? '♡ The Bride ♡' : '♡ The Groom ♡'}
          </p>
        )}
        {!isCouple && (
          <p className="font-sans text-sunrise-pink text-xs tracking-[0.25em] uppercase mb-4">
            Welcome back
          </p>
        )}
        <h1
          className={`font-serif text-paper text-5xl md:text-6xl text-gilt ${
            isCouple ? 'text-6xl md:text-7xl' : ''
          }`}
        >
          {firstName}
        </h1>
        <p className="font-sans text-paper/50 text-xs tracking-[0.3em] uppercase mt-4">
          The Guest Lounge
        </p>
        {isCouple && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="block h-px w-10 bg-sunrise-pink/40" />
            <span className="font-sans text-sunrise-pink/70 text-xs tracking-[0.2em] uppercase">
              Your posts will be highlighted for guests
            </span>
            <span className="block h-px w-10 bg-sunrise-pink/40" />
          </div>
        )}
      </section>

      {/* ── Who's Who Wall ─────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-palmetto text-3xl mb-2 text-pressed">Who's Who</h2>
            <p className="font-sans text-sage text-xs tracking-[0.2em] uppercase">
              Put a face to a name before the big day
            </p>
          </div>

          {/* ── Your intro card ── */}
          <div className="max-w-xl mx-auto mb-12">
            <div className={`border rounded-lg p-6 paper-lift ${isCouple ? 'border-sunrise-pink/20 bg-palmetto/5' : 'border-sage/20'}`}>
              <div className="mb-5">
                <h3 className="font-serif text-palmetto text-lg text-pressed">Your intro</h3>
                <p className="font-sans text-sage text-xs tracking-[0.1em] mt-0.5">
                  {isCouple ? 'Write a note and add your photo — your card will appear at the top of the wall' : 'This is how you\'ll appear on the wall'}
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

      {/* ── Coming Soon features ───────────────────────────────────────────── */}
      <section className="bg-sage/5 py-16 px-6 paper-edge-top">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-palmetto text-2xl text-center mb-2 text-pressed">
            More to Come
          </h2>
          <p className="font-sans text-sage text-xs tracking-[0.2em] uppercase text-center mb-10">
            Interactive features rolling out closer to the wedding
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {COMING_SOON.map(card => (
              <div
                key={card.title}
                className="border border-sage/20 rounded-lg p-6 paper-lift bg-paper"
              >
                <h3 className="font-serif text-palmetto text-xl mb-2 text-pressed">
                  {card.title}
                </h3>
                <p className="font-sans text-sage text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
