import { useState } from 'react'
import { FUN_FACT_PROMPTS } from '../../hooks/useGuestProfiles'
import { useImageReveal } from '../../hooks/useImageReveal'

/** Deterministic rotation derived from the guest ID string (guest cards only). */
function getRotation(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return (h % 11) - 5 // degrees, -5 to +5
}

/** Deterministic vertical nudge so guest cards look scattered. */
function getYOffset(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (id.charCodeAt(i) * 3) + ((h << 3) - h)
  return (h % 21) - 10 // px, -10 to +10
}

/** Couple cards lean toward each other — bride tilts right, groom tilts left. */
function getCoupleRotation(role) {
  return role === 'bride' ? 2.5 : -2.5
}

const TAPE_ROTATE_OPTIONS = ['-4deg', '3deg', '-2deg', '5deg', '-6deg']
function getTapeRotate(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 3) - h)
  return TAPE_ROTATE_OPTIONS[Math.abs(h) % TAPE_ROTATE_OPTIONS.length]
}

const GUEST_DIMS  = { width: 190, photoHeight: 165, captionPad: 40 }
const COUPLE_DIMS = { width: 230, photoHeight: 260, captionPad: 52 }

/**
 * Piece of tape at the top of a polaroid face.
 * Couple cards' frame sits flush at `top: 0`, so the tape needs to sit above
 * it (`top: -15`) to look stuck on. Guest cards' frame is already inset by
 * `top: 18px` to make room for the tape, so the tape belongs at `top: 0`
 * there — otherwise it floats above the card with a visible gap.
 */
function Tape({ rotate, top = -15 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: '50%',
        width: '60px',
        height: '22px',
        borderRadius: '2px',
        background: 'rgba(253, 230, 185, 0.60)',
        transform: `translateX(-50%) rotate(${rotate})`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        zIndex: 2,
      }}
    />
  )
}

/**
 * Polaroid card used on the Lounge "Who's Who" wall.
 * Renders either a guest card (white frame, small) or a couple card
 * (palmetto-green frame, larger, no random Y-offset) depending on
 * `profile.isCouple`. Click/tap flips the card to reveal a hand-written
 * note on the back.
 */
export default function PolaroidCard({ profile, isOwn = false, onEdit }) {
  const [flipped, setFlipped] = useState(false)

  const isCouple = !!profile.isCouple
  const dims     = isCouple ? COUPLE_DIMS : GUEST_DIMS
  const rotate   = isCouple ? getCoupleRotation(profile.coupleRole) : getRotation(profile.id)
  const yOffset  = isCouple ? 0 : getYOffset(profile.id)
  const tapeRot  = getTapeRotate(profile.id)

  const firstName    = profile.guestName?.split(' ')[0] ?? profile.guestName ?? '?'
  const promptLabel  = FUN_FACT_PROMPTS.find(p => p.key === profile.promptKey)?.label ?? ''
  const roleLabel    = profile.coupleRole === 'bride' ? '♡ The Bride ♡' : '♡ The Groom ♡'

  const totalHeight = isCouple
    ? 28 + dims.photoHeight + dims.captionPad + 60
    : 28 + dims.photoHeight + dims.captionPad + 10

  return (
    // Stacking context lives on its own element, separate from the one
    // establishing `perspective` below — combining `perspective` with a
    // `z-index` stacking context on the *same* element is what broke the
    // flip animation in Safari (the back face silently stopped rendering).
    <div style={{ position: 'relative', zIndex: 101 }}>
      <div
        className="inline-block select-none"
        style={{
          transform: `rotate(${rotate}deg) translateY(${yOffset}px)`,
          width: `${dims.width}px`,
          perspective: '900px',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: `${totalHeight}px`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: 'pointer',
          }}
          onClick={() => setFlipped(f => !f)}
          role="button"
          aria-pressed={flipped}
          aria-label={`${firstName}'s polaroid — click to ${flipped ? 'see photo' : 'read the note'}`}
        >
          {/* ── FRONT ── */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <Tape rotate={tapeRot} top={isCouple ? -15 : 0} />

            {isCouple ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#5c7543',
                  padding: `12px 12px ${dims.captionPad}px 12px`,
                  boxShadow: '0 6px 16px rgba(0,0,0,0.40), 0 16px 40px rgba(0,0,0,0.30)',
                }}
              >
                <PhotoArea profile={profile} isOwn={isOwn} onEdit={onEdit} height={dims.photoHeight} couple />

                <div className="flex flex-col items-center justify-center" style={{ paddingTop: 10 }}>
                  <div className="flex items-center gap-2 w-full mb-1.5">
                    <span style={{ flex: 1, height: 1, background: 'rgba(248,200,220,0.35)' }} />
                    <span className="font-sans text-sunrise-pink/50 text-[10px]">✦</span>
                    <span style={{ flex: 1, height: 1, background: 'rgba(248,200,220,0.35)' }} />
                  </div>
                  <p className="font-serif text-paper text-xl leading-tight text-gilt tracking-wide">
                    {firstName}
                  </p>
                  <p className="font-sans text-sunrise-pink/70 text-[9px] tracking-[0.25em] uppercase mt-0.5">
                    {roleLabel}
                  </p>
                  {isOwn && (
                    <button
                      onClick={e => { e.stopPropagation(); onEdit?.() }}
                      className="font-sans text-sunrise-pink/40 text-[9px] tracking-widest uppercase hover:text-sunrise-pink transition-colors mt-1"
                    >
                      edit
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="bg-paper absolute"
                style={{
                  top: '18px',
                  left: 0,
                  right: 0,
                  padding: `10px 10px ${dims.captionPad}px 10px`,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.22)',
                }}
              >
                <PhotoArea profile={profile} isOwn={isOwn} onEdit={onEdit} height={dims.photoHeight} />

                <div className="flex items-end justify-between pt-2 pb-1">
                  <p className="font-serif text-palmetto text-lg leading-tight text-pressed">
                    {firstName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── BACK ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <Tape rotate={tapeRot} top={isCouple ? -15 : 0} />

            {isCouple ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#5c7543',
                  padding: '20px 18px 18px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.40), 0 16px 40px rgba(0,0,0,0.30)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ flex: 1, height: 1, background: 'rgba(248,200,220,0.30)' }} />
                  <span className="font-sans text-sunrise-pink/40 text-[10px]">✦</span>
                  <span style={{ flex: 1, height: 1, background: 'rgba(248,200,220,0.30)' }} />
                </div>

                <p className="font-sans text-sunrise-pink/60 text-[9px] tracking-[0.22em] uppercase mb-3">
                  A note from {firstName}
                </p>

                <p
                  className="font-serif text-paper/90 text-sm leading-relaxed flex-1"
                  style={{ display: '-webkit-box', WebkitLineClamp: 9, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {profile.funFactText || '…'}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <span style={{ flex: 1, height: 1, background: 'rgba(248,200,220,0.25)' }} />
                  <p className="font-serif text-sunrise-pink/60 text-xs italic">
                    — {roleLabel}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="bg-paper absolute overflow-hidden"
                style={{
                  top: '18px',
                  left: 0,
                  right: 0,
                  height: `${dims.photoHeight + dims.captionPad + 20}px`,
                  padding: '16px 14px 14px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.22)',
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 22px, rgba(138,154,134,0.12) 22px, rgba(138,154,134,0.12) 23px)',
                }}
              >
                <p className="font-sans text-sage/70 text-[9px] tracking-[0.2em] uppercase mb-2 leading-tight">
                  {promptLabel}
                </p>
                <p
                  className="font-serif text-palmetto text-sm leading-snug overflow-hidden text-pressed"
                  style={{ display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {profile.funFactText || '…'}
                </p>
                <p className="font-sans text-sage/40 text-[10px] tracking-widest uppercase absolute bottom-3 right-4">
                  — {firstName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flip hint — fades on hover */}
      <p className="font-sans text-sage/40 text-[9px] tracking-[0.15em] uppercase text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        tap to flip
      </p>
    </div>
  )
}

/** Photo (or placeholder) shown on the front face, shared between variants. */
function PhotoArea({ profile, isOwn, onEdit, height, couple = false }) {
  const { loaded, imgRef, onLoad } = useImageReveal()

  return (
    <div
      className={couple ? 'relative overflow-hidden' : 'overflow-hidden bg-sage/10 relative'}
      style={{
        height: `${height}px`,
        ...(couple ? { background: profile.selfieUrl ? undefined : 'rgba(255,255,255,0.06)' } : {}),
        // Firefox stops respecting an ancestor's backface-visibility once a
        // descendant gets its own compositing layer (via `filter` or
        // `mix-blend-mode`, both used below) — it keeps rendering that layer
        // even when the flip card's front face is turned away. Re-declaring
        // backface-visibility here (and on the filtered/blended children)
        // fixes the "stuck front face" bug on Firefox desktop.
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {profile.selfieUrl ? (
        <>
          <img
            ref={imgRef}
            src={profile.selfieUrl}
            alt={profile.guestName?.split(' ')[0] ?? profile.guestName ?? '?'}
            className={`w-full h-full object-cover block ${loaded ? 'photo-reveal-landed' : 'photo-reveal-pending'}`}
            onLoad={onLoad}
            style={{
              filter: `contrast(${couple ? 1.05 : 1.06}) saturate(${couple ? 1.08 : 1.1}) brightness(1.02)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,${couple ? 0.18 : 0.20}) 0%, rgba(255,255,255,0.03) 45%, transparent 100%)`,
              mixBlendMode: 'screen',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isOwn ? (
            <button
              onClick={e => { e.stopPropagation(); onEdit?.() }}
              className={
                couple
                  ? 'font-sans text-xs text-sunrise-pink/70 tracking-[0.15em] uppercase hover:text-sunrise-pink transition-colors text-center px-4'
                  : 'font-sans text-xs text-sage/70 tracking-[0.15em] uppercase hover:text-palmetto transition-colors text-center px-3'
              }
            >
              + Add your photo
            </button>
          ) : (
            <span className={couple ? 'font-serif text-sunrise-pink/30 text-5xl select-none' : 'font-serif text-sage/40 text-5xl select-none'}>
              {couple ? '♡' : '?'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
