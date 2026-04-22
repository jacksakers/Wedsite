import { useState, useEffect } from 'react'
import AccordionItem from '../components/AccordionItem'
import { VENUE_CITY } from '../constants/weddingInfo'
import {
  getSiteContent,
  DEFAULT_SCHEDULE,
  DEFAULT_HOTELS,
  DEFAULT_COLUMBIA_GUIDE,
  DEFAULT_FAQS,
} from '../hooks/useSiteContent'

export default function Information() {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [hotels, setHotels] = useState(DEFAULT_HOTELS)
  const [columbiaGuide, setColumbiaGuide] = useState(DEFAULT_COLUMBIA_GUIDE)
  const [faqs, setFaqs] = useState(DEFAULT_FAQS)

  useEffect(() => {
    getSiteContent().then(data => {
      setSchedule(data.schedule)
      setHotels(data.hotels)
      setColumbiaGuide(data.columbiaGuide)
      setFaqs(data.faqs)
    }).catch(() => { /* fall back to defaults already in state */ })
  }, [])
  return (
    <main className="bg-paper space-y-2">
      {/* Page Header */}
      <section className="bg-palmetto py-20 px-6 text-center velvet-surface">
        <h1 className="font-serif text-paper text-5xl md:text-6xl mb-4 text-gilt">The Details</h1>
        <p className="font-sans text-paper/70 text-xs tracking-[0.25em] uppercase">
          Everything you need to know
        </p>
      </section>

      {/* Schedule */}
      <section className="py-20 px-6 max-w-3xl mx-auto paper-lift mt-12">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-12 text-center text-pressed">
          Day-of Schedule
        </h2>
        <ol className="space-y-0">
          {schedule.map(({ id, time, event, note }, index) => (
            <li key={id ?? time} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-sage mt-1.5 flex-shrink-0 ring-4 ring-paper" />
                {index < schedule.length - 1 && (
                  <div className="w-px flex-1 bg-sage/30 my-1" />
                )}
              </div>
              <div className="pb-10">
                <p className="font-sans text-sunrise-orange text-xs tracking-widest uppercase mb-1">
                  {time}
                </p>
                <h3 className="font-serif text-palmetto text-xl mb-1">{event}</h3>
                {note && <p className="font-sans text-sage text-sm">{note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="border-t border-sage/20 max-w-3xl mx-auto" />

      {/* Travel & Lodging */}
      <section className="py-20 px-6 max-w-3xl mx-auto paper-lift">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-12 text-center text-pressed">
          Travel & Lodging
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {hotels.map(({ id, name, distance, note, href }) => (
            <a
              key={id ?? name}
              href={href}
              className="block bg-sage/10 rounded-lg p-6 border border-sage/20 hover:bg-sage/20 transition-colors"
            >
              <p className="font-serif text-palmetto text-xl mb-1">{name}</p>
              <p className="font-sans text-sunrise-orange text-xs tracking-widest uppercase mb-3">
                {distance}
              </p>
              <p className="font-sans text-sage text-sm">{note}</p>
            </a>
          ))}
        </div>
        <p className="font-sans text-sage text-sm text-center italic">
          We also recommend checking Airbnb for charming options in the Irmo / Lake Murray area.
        </p>
      </section>

      <div className="border-t border-sage/20 max-w-3xl mx-auto" />

      {/* Columbia Weekend Guide */}
      <section className="py-20 px-6 max-w-3xl mx-auto paper-lift">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-4 text-center text-pressed">
          Make a Weekend of It
        </h2>
        <p className="font-sans text-sage text-sm text-center mb-12">
          Our favorite spots in the Columbia / {VENUE_CITY} area
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {columbiaGuide.map(({ id, category, items }) => (
            <div key={id ?? category}>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-sunrise-orange mb-4 border-b border-sage/30 pb-2">
                {category}
              </h3>
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="font-sans text-sage text-sm">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-sage/20 max-w-3xl mx-auto" />

      {/* FAQ */}
      <section className="py-20 px-6 max-w-3xl mx-auto paper-lift mb-20">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-10 text-center text-pressed">
          Frequently Asked Questions
        </h2>
        <div>
          {faqs.map(({ id, question, answer }) => (
            <AccordionItem key={id ?? question} question={question} answer={answer} />
          ))}
        </div>
      </section>
    </main>
  )
}
