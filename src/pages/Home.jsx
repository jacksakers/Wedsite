import CountdownTimer from '../components/CountdownTimer'
import { COUPLE_DISPLAY, VENUE_NAME, VENUE_CITY, WEDDING_TIME_DISPLAY, PARTNER_ONE_FIRST, PARTNER_ONE_MIDDLE, PARTNER_ONE_LAST, PARTNER_TWO_FIRST, PARTNER_TWO_MIDDLE, PARTNER_TWO_LAST } from '../constants/weddingInfo'
import dockPhoto from '../assets/dock_photo.jpg'
import dressedUp from '../assets/dressed_up.jpg'
import lyonRun from '../assets/lyon_run.jpg'
import laLeona from '../assets/la_leona.jpg'

function Polaroid({ src, alt, rotate, tapeRotate, className = '' }) {
  return (
    <div className={className} style={{ transform: `rotate(${rotate})` }}>
      <div className="relative">
        {/* Tape */}
        <div
          className="absolute -top-4 left-1/2 w-16 h-6 rounded-sm z-10"
          style={{
            background: 'rgba(253, 230, 185, 0.55)',
            transform: `translateX(-50%) rotate(${tapeRotate})`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
        {/* Polaroid frame */}
        <div
          className="bg-paper relative"
          style={{
            width: '224px',
            padding: '12px 12px 44px 12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3), 0 12px 28px rgba(0,0,0,0.25)',
          }}
        >
          <div className="relative overflow-hidden" style={{ height: '200px' }}>
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover block"
              style={{ filter: 'contrast(1.08) saturate(1.12) brightness(1.03)' }}
            />
            {/* Glossy film sheen */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.0) 100%)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center 
                            bg-palmetto text-center px-6 py-16 overflow-hidden velvet-surface">
        {/*
          Replace the div below with an <img> of your engagement photo once available.
          e.g. <img src="/engagement.jpg" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
        */}
        {/* <div className="absolute inset-0 bg-sage/10 pointer-events-none" /> */}

        <div className="relative w-full max-w-3xl mx-auto" style={{ zIndex: 120 }}>

          {/* Top polaroid row: 2 photos on md+, 1 on mobile */}
          <div className="flex justify-between items-end mb-10 px-2">
            <Polaroid src={dockPhoto}  alt="At the dock"  rotate="6deg"  tapeRotate="-4deg" />
            <Polaroid src={dressedUp}  alt="Dressed up"   rotate="-5deg" tapeRotate="3deg"  className="hidden sm:block" />
          </div>

          {/* Wedding text */}
          <div className="text-center">
            <p className="font-sans text-sunrise-pink tracking-[0.35em] uppercase text-xs mb-8">
              You are cordially invited to celebrate the wedding of
            </p>
            <h1 className="font-serif text-paper leading-tight mb-6 text-gilt flex flex-col items-center gap-1" style={{ fontSize: 'clamp(1.6rem, 7vw, 3.75rem)' }}>
              <span className="whitespace-nowrap">{PARTNER_ONE_FIRST} {PARTNER_ONE_MIDDLE} {PARTNER_ONE_LAST}</span>
              <span className="whitespace-nowrap" style={{ fontSize: 'clamp(1.2rem, 5vw, 3rem)' }}>&amp;</span>
              <span className="whitespace-nowrap">{PARTNER_TWO_FIRST} {PARTNER_TWO_MIDDLE} {PARTNER_TWO_LAST}</span>
            </h1>
            <div className="flex items-center justify-center gap-4 my-6">
              <span className="block h-px w-16 bg-sunrise-pink/50" />
              <span className="font-sans text-paper/70 tracking-[0.25em] uppercase text-xs">
                {WEDDING_TIME_DISPLAY}
              </span>
              <span className="block h-px w-16 bg-sunrise-pink/50" />
            </div>
            <p className="font-serif text-paper/80 text-xl italic mb-2">{VENUE_NAME}</p>
            <p className="font-sans text-paper/60 tracking-[0.2em] uppercase text-xs">
              March 13, 2027 · {VENUE_CITY}
            </p>
          </div>

          {/* Bottom polaroid row: 2 photos on md+, 1 on mobile */}
          <div className="flex justify-between items-start mt-10 px-2">
            <Polaroid src={lyonRun}  alt="Lyon run"  rotate="-4deg" tapeRotate="2deg"  className="ml-auto sm:ml-0" />
            <Polaroid src={laLeona} alt="La Leona"  rotate="7deg"  tapeRotate="-5deg" className="hidden sm:block" />
          </div>

        </div>
      </section>

      {/* Countdown */}
      <section className="bg-paper py-20 px-6 paper-lift">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-2 text-pressed">
            Counting Down
          </h2>
          <p className="font-sans text-sage text-xs tracking-[0.25em] uppercase mb-12">
            Until we say "I do"
          </p>
          <CountdownTimer />
        </div>
      </section>

      {/* Welcome note */}
      <section className="bg-sage/10 py-20 px-6 paper-lift">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-6 text-pressed">
            Welcome, Dear Guests
          </h2>
          <p className="font-sans text-sage leading-relaxed">
            We are so grateful to celebrate this milestone surrounded by the people who matter
            most to us. Join us for an intimate afternoon of love and laughter amid the beautiful
            gardens of {VENUE_CITY}.
          </p>
        </div>
      </section>
    </main>
  )
}
