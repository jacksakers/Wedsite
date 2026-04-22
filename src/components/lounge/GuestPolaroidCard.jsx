import { useState } from 'react'
import { FUN_FACT_PROMPTS } from '../../hooks/useGuestProfiles'

/** Deterministic rotation derived from the guest ID string. */
function getRotation(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h)
  return ((h % 11) - 5) // degrees, -5 to +5
}

/** Deterministic vertical nudge so cards look scattered. */
function getYOffset(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (id.charCodeAt(i) * 3) + ((h << 3) - h)
  return ((h % 21) - 10) // px, -10 to +10
}

const CARD_WIDTH  = 190
const PHOTO_HEIGHT = 165
const CAPTION_PAD  = 40

const TAPE_ROTATE_OPTIONS = ['-4deg', '3deg', '-2deg', '5deg', '-6deg']
function getTapeRotate(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 3) - h)
  return TAPE_ROTATE_OPTIONS[Math.abs(h) % TAPE_ROTATE_OPTIONS.length]
}

export default function GuestPolaroidCard({ profile, isOwn = false, onEdit }) {
  const [flipped, setFlipped] = useState(false)

  const rotate   = getRotation(profile.id)
  const yOffset  = getYOffset(profile.id)
  const tapeRot  = getTapeRotate(profile.id)
  const firstName = profile.guestName?.split(' ')[0] ?? profile.guestName ?? '?'
  const promptLabel = FUN_FACT_PROMPTS.find(p => p.key === profile.promptKey)?.label ?? ''

  const totalHeight = 28 + PHOTO_HEIGHT + CAPTION_PAD + 10 // tape space + photo + caption + bottom padding

  return (
    <div
      className="inline-block select-none"
      style={{
        transform: `rotate(${rotate}deg) translateY(${yOffset}px)`,
        width: `${CARD_WIDTH}px`,
        perspective: '900px',
      }}
    >
      {/* Flip container */}
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
        aria-label={`${firstName}'s polaroid — click to ${flipped ? 'see photo' : 'read fun fact'}`}
      >
        {/* ── FRONT ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Tape */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '60px',
              height: '22px',
              borderRadius: '2px',
              background: 'rgba(253, 230, 185, 0.60)',
              transform: `translateX(-50%) rotate(${tapeRot})`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              zIndex: 2,
            }}
          />

          {/* Polaroid frame */}
          <div
            className="bg-paper absolute"
            style={{
              top: '18px',
              left: 0,
              right: 0,
              padding: `10px 10px ${CAPTION_PAD}px 10px`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.22)',
            }}
          >
            {/* Photo area */}
            <div
              className="overflow-hidden bg-sage/10 relative"
              style={{ height: `${PHOTO_HEIGHT}px` }}
            >
              {profile.selfieUrl ? (
                <>
                  <img
                    src={profile.selfieUrl}
                    alt={firstName}
                    className="w-full h-full object-cover block"
                    style={{ filter: 'contrast(1.06) saturate(1.1) brightness(1.02)' }}
                  />
                  {/* Glossy film sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.03) 45%, transparent 100%)',
                      mixBlendMode: 'screen',
                    }}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isOwn ? (
                    <button
                      onClick={e => { e.stopPropagation(); onEdit?.() }}
                      className="font-sans text-xs text-sage/70 tracking-[0.15em] uppercase hover:text-palmetto transition-colors text-center px-3"
                    >
                      + Add your photo
                    </button>
                  ) : (
                    <span className="font-serif text-sage/40 text-5xl select-none">?</span>
                  )}
                </div>
              )}
            </div>

            {/* Caption — name at bottom of white area */}
            <div className="flex items-end justify-between pt-2 pb-1">
              <p className="font-serif text-palmetto text-lg leading-tight text-pressed">
                {firstName}
              </p>
              {isOwn && (
                <button
                  onClick={e => { e.stopPropagation(); onEdit?.() }}
                  className="font-sans text-sage/50 text-[10px] tracking-widest uppercase hover:text-palmetto transition-colors"
                >
                  edit
                </button>
              )}
            </div>
          </div>
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
          {/* Back tape */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '60px',
              height: '22px',
              borderRadius: '2px',
              background: 'rgba(253, 230, 185, 0.60)',
              transform: `translateX(-50%) rotate(${tapeRot})`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              zIndex: 2,
            }}
          />

          {/* Back card frame — same size as front */}
          <div
            className="bg-paper absolute overflow-hidden"
            style={{
              top: '18px',
              left: 0,
              right: 0,
              height: `${PHOTO_HEIGHT + CAPTION_PAD + 20}px`,
              padding: '16px 14px 14px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.28), 0 10px 24px rgba(0,0,0,0.22)',
              backgroundImage: "repeating-linear-gradient(transparent, transparent 22px, rgba(138,154,134,0.12) 22px, rgba(138,154,134,0.12) 23px)",
            }}
          >
            <p className="font-sans text-sage/70 text-[9px] tracking-[0.2em] uppercase mb-2 leading-tight">
              {promptLabel}
            </p>
            <p className="font-serif text-palmetto text-sm leading-snug overflow-hidden text-pressed"
              style={{ display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {profile.funFactText || '…'}
            </p>
            <p className="font-sans text-sage/40 text-[10px] tracking-widest uppercase absolute bottom-3 right-4">
              — {firstName}
            </p>
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
