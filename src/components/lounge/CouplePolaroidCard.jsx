import { useState } from 'react'

const CARD_WIDTH   = 230
const PHOTO_HEIGHT = 260
const CAPTION_PAD  = 52

const TAPE_ROTATE_OPTIONS = ['-4deg', '3deg', '-2deg', '5deg', '-6deg']
function getTapeRotate(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 3) - h)
  return TAPE_ROTATE_OPTIONS[Math.abs(h) % TAPE_ROTATE_OPTIONS.length]
}

/** Couple cards lean toward each other — bride tilts right, groom tilts left. */
function getCoupleRotation(role) {
  return role === 'bride' ? '2.5deg' : '-2.5deg'
}

export default function CouplePolaroidCard({ profile, isOwn = false, onEdit }) {
  const [flipped, setFlipped] = useState(false)

  const rotate    = getCoupleRotation(profile.coupleRole)
  const roleLabel = profile.coupleRole === 'bride' ? '♡ The Bride ♡' : '♡ The Groom ♡'
  const firstName = profile.guestName?.split(' ')[0] ?? profile.guestName ?? '?'
  const totalHeight = 28 + PHOTO_HEIGHT + CAPTION_PAD + 60
  const tapeRot  = getTapeRotate(profile.id)

  return (
    <div
      className="inline-block select-none"
      style={{ transform: `rotate(${rotate})`, width: `${CARD_WIDTH}px`, perspective: '900px', position: 'relative', zIndex: 101 }}
    >
      <div
        style={{
          position: 'relative',
          height: `${totalHeight}px`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
        onClick={() => setFlipped(f => !f)}
        role="button"
        aria-pressed={flipped}
        aria-label={`${firstName}'s polaroid — click to ${flipped ? 'see photo' : 'read note'}`}
      >

        {/* ── FRONT ── */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          {/* Tape */}
          <div
            style={{
              position: 'absolute',
              top: -15,
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
          
          {/* Palmetto-green polaroid frame */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#5c7543',
              padding: `12px 12px ${CAPTION_PAD}px 12px`,
              boxShadow: '0 6px 16px rgba(0,0,0,0.40), 0 16px 40px rgba(0,0,0,0.30)',
            }}
          >
            {/* Photo */}
            <div className="relative overflow-hidden" style={{ height: `${PHOTO_HEIGHT}px` }}>
              {profile.selfieUrl ? (
                <>
                  <img
                    src={profile.selfieUrl}
                    alt={firstName}
                    className="w-full h-full object-cover block"
                    style={{ filter: 'contrast(1.05) saturate(1.08) brightness(1.02)' }}
                  />
                  {/* Glossy sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 45%, transparent 100%)',
                      mixBlendMode: 'screen',
                    }}
                  />
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {isOwn ? (
                    <button
                      onClick={e => { e.stopPropagation(); onEdit?.() }}
                      className="font-sans text-xs text-sunrise-pink/70 tracking-[0.15em] uppercase hover:text-sunrise-pink transition-colors text-center px-4"
                    >
                      + Add your photo
                    </button>
                  ) : (
                    <span className="font-serif text-sunrise-pink/30 text-5xl select-none">♡</span>
                  )}
                </div>
              )}
            </div>

            {/* Caption area — inside the green frame below the photo */}
            <div className="flex flex-col items-center justify-center" style={{ paddingTop: 10 }}>
              {/* Thin botanical rule */}
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
        </div>

        {/* ── BACK ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}>
          {/* Back tape */}
          <div
            style={{
              position: 'absolute',
              top: -15,
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
            {/* Decorative top rule */}
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

            {/* Signature */}
            <div className="mt-4 flex items-center gap-2">
              <span style={{ flex: 1, height: 1, background: 'rgba(248,200,220,0.25)' }} />
              <p className="font-serif text-sunrise-pink/60 text-xs italic">
                — {roleLabel}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
