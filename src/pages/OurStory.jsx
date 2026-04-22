import { useState, useEffect } from 'react'
import { getOurStory, DEFAULT_MILESTONES } from '../hooks/useOurStory'

function ImagePlaceholder({ hint }) {
  return (
    <div className="w-full aspect-[4/3] border-2 border-dashed border-sage/25 rounded-lg flex flex-col items-center justify-center gap-3 bg-sage/5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 text-sage/30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.172a2 2 0 001.414-.586l.828-.828A2 2 0 018.828 5h6.344a2 2 0 011.414.586l.828.828A2 2 0 0018.828 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {hint && (
        <p className="font-sans text-sage/45 text-xs text-center px-6 leading-relaxed italic">
          {hint}
        </p>
      )}
    </div>
  )
}

export default function OurStory() {
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES)

  useEffect(() => {
    getOurStory()
      .then(data => setMilestones(data.milestones))
      .catch(() => { /* fall back to defaults already in state */ })
  }, [])

  return (
    <main className="bg-paper">
      {/* Hero */}
      <section className="bg-palmetto py-20 px-6 text-center velvet-surface">
        <h1 className="font-serif text-paper text-5xl md:text-6xl mb-4 text-gilt">Our Story</h1>
        <p className="font-sans text-paper/70 text-xs tracking-[0.25em] uppercase">
          A conversation that never ended
        </p>
      </section>

      {/* Intro */}
      <section className="py-16 px-6 max-w-2xl mx-auto text-center">
        <p className="font-serif text-sage text-xl italic leading-relaxed">
          It started with coffee on a rainy afternoon and somehow never stopped.
          Here, in chronological order, is how two people became us.
        </p>
      </section>

      {/* Timeline */}
      <section className="pb-24 px-6">
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical center line — desktop only */}
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(to bottom, transparent, #8A9A8650, #8A9A8650, transparent)' }}
          />

          {milestones.map((m, i) => {
            const isEven = i % 2 === 0
            return (
              <div key={m.id} className="relative mb-16 md:mb-20">
                {/* Timeline dot */}
                <div className="hidden md:flex absolute left-1/2 top-6 -translate-x-1/2 w-3 h-3 rounded-full bg-paper border-2 border-sage/50 z-10" />

                <div className={`flex flex-col md:flex-row gap-8 md:gap-0 ${isEven ? '' : 'md:flex-row-reverse'}`}>
                  {/* Text side */}
                  <div className={`flex-1 ${isEven ? 'md:pr-14 md:text-right' : 'md:pl-14'}`}>
                    <span className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase">
                      {m.season}
                    </span>
                    <h3 className="font-serif text-palmetto text-2xl md:text-3xl mt-1 mb-3 text-pressed">
                      {m.title}
                    </h3>
                    <p className="font-sans text-sage text-sm leading-relaxed">
                      {m.body}
                    </p>
                  </div>

                  {/* Image side */}
                  <div className={`flex-1 ${isEven ? 'md:pl-14' : 'md:pr-14'}`}>
                    {m.photoUrl
                      ? <img src={m.photoUrl} alt={m.title} className="w-full aspect-[4/3] object-cover rounded-lg" />
                      : <ImagePlaceholder hint={m.imageHint} />
                    }
                  </div>
                </div>
              </div>
            )
          })}

          {/* Final closing milestone */}
          <div className="relative mt-4">
            <div className="hidden md:flex absolute left-1/2 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-palmetto border-2 border-paper z-10"
              style={{ boxShadow: '0 0 0 3px #8A9A8640' }}
            />
            <div className="text-center py-12 px-6 max-w-xl mx-auto">
              <span className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase">
                March 13, 2027
              </span>
              <h3 className="font-serif text-palmetto text-3xl md:text-4xl mt-2 mb-4 text-pressed">
                The Wedding
              </h3>
              <p className="font-sans text-sage text-sm leading-relaxed">
                The next chapter begins on what will be their four-year anniversary.
                You're already here — and we can't wait to celebrate with you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
