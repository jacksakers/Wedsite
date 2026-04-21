import CountdownTimer from '../components/CountdownTimer'
import { COUPLE_DISPLAY, VENUE_NAME, VENUE_CITY, WEDDING_TIME_DISPLAY } from '../constants/weddingInfo'

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[90svh] flex flex-col items-center justify-center bg-palmetto text-center px-6 py-24 overflow-hidden">
        {/*
          Replace the div below with an <img> of your engagement photo once available.
          e.g. <img src="/engagement.jpg" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
        */}
        <div className="absolute inset-0 bg-sage/10 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="font-sans text-sunrise-pink tracking-[0.35em] uppercase text-xs mb-8">
            You are cordially invited to celebrate the wedding of
          </p>
          <h1 className="font-serif text-paper text-6xl sm:text-7xl md:text-8xl leading-none mb-6">
            {COUPLE_DISPLAY}
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
      </section>

      {/* Countdown */}
      <section className="bg-paper py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-2">
            Counting Down
          </h2>
          <p className="font-sans text-sage text-xs tracking-[0.25em] uppercase mb-12">
            Until we say "I do"
          </p>
          <CountdownTimer />
        </div>
      </section>

      {/* Welcome note */}
      <section className="bg-sage/10 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-6">
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
