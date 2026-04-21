import AccordionItem from '../components/AccordionItem'
import { VENUE_CITY } from '../constants/weddingInfo'

const SCHEDULE = [
  { time: '2:30 PM', event: 'Guest Arrival & Seating', note: 'Please arrive 30 minutes before the ceremony.' },
  { time: '3:00 PM', event: 'Ceremony Begins', note: 'Ceremony will be held in the garden.' },
  { time: '3:45 PM', event: 'Cocktail Hour', note: 'Light refreshments on the veranda.' },
  { time: '5:00 PM', event: 'Reception Dinner', note: '' },
  { time: '8:00 PM', event: 'Dancing & Celebration', note: '' },
  { time: '10:00 PM', event: 'Grand Send-Off', note: '' },
]

const HOTELS = [
  {
    name: 'Hotel Block 1',           // TODO: Replace with actual hotel name
    distance: '5 min drive',
    note: 'Room block available — mention our wedding when booking.',
    href: '#',                        // TODO: Replace with booking link
  },
  {
    name: 'Hotel Block 2',           // TODO: Replace with actual hotel name
    distance: '10 min drive',
    note: 'Great value option near I-26.',
    href: '#',                        // TODO: Replace with booking link
  },
]

const COLUMBIA_GUIDE = [
  {
    category: 'Restaurants',
    items: ['Add your favorites here', 'Another recommendation', 'A third spot'],
  },
  {
    category: 'Things To Do',
    items: ['Riverbanks Zoo & Garden', 'Soda City Market', 'Congaree National Park'],
  },
  {
    category: 'Coffee & Sweets',
    items: ['Add a local café here'],
  },
]

const FAQS = [
  {
    question: 'What is the dress code?',
    answer:
      'Garden Formal or Cocktail Attire. Think florals, pastels, and elegance. Please avoid wearing white or ivory. We recommend block heels or wedges as portions of the reception are on grass.',
  },
  {
    question: 'Can I bring a plus-one?',
    answer:
      'Due to our intimate venue size, plus-ones are limited. Your invitation will specify if a guest is included. Please reach out to us directly with any questions.',
  },
  {
    question: 'Are children welcome?',
    answer:
      'We adore your little ones! However, our celebration is designed as an adult evening. We encourage you to use this as a well-deserved night out.',
  },
  {
    question: 'Will there be dietary options?',
    answer:
      'Absolutely. Please note any dietary restrictions (vegetarian, vegan, gluten-free, allergies) in your RSVP and we will do our best to accommodate everyone.',
  },
  {
    question: 'Is the venue accessible?',
    answer:
      'Yes. The venue is fully accessible. Please contact us directly if you have specific needs and we will make sure you are taken care of.',
  },
  {
    question: 'What happens if it rains?',
    answer:
      'The venue has a beautiful indoor contingency space. The celebration goes on, rain or shine!',
  },
]

export default function Information() {
  return (
    <main className="bg-paper">
      {/* Page Header */}
      <section className="bg-palmetto py-20 px-6 text-center">
        <h1 className="font-serif text-paper text-5xl md:text-6xl mb-4">The Details</h1>
        <p className="font-sans text-paper/70 text-xs tracking-[0.25em] uppercase">
          Everything you need to know
        </p>
      </section>

      {/* Schedule */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-12 text-center">
          Day-of Schedule
        </h2>
        <ol className="space-y-0">
          {SCHEDULE.map(({ time, event, note }, index) => (
            <li key={time} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-sage mt-1.5 flex-shrink-0 ring-4 ring-paper" />
                {index < SCHEDULE.length - 1 && (
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
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-12 text-center">
          Travel & Lodging
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {HOTELS.map(({ name, distance, note, href }) => (
            <a
              key={name}
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
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-4 text-center">
          Make a Weekend of It
        </h2>
        <p className="font-sans text-sage text-sm text-center mb-12">
          Our favorite spots in the Columbia / {VENUE_CITY} area
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {COLUMBIA_GUIDE.map(({ category, items }) => (
            <div key={category}>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-sunrise-orange mb-4 border-b border-sage/30 pb-2">
                {category}
              </h3>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item} className="font-sans text-sage text-sm">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-sage/20 max-w-3xl mx-auto" />

      {/* FAQ */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <h2 className="font-serif text-palmetto text-3xl md:text-4xl mb-10 text-center">
          Frequently Asked Questions
        </h2>
        <div>
          {FAQS.map(({ question, answer }) => (
            <AccordionItem key={question} question={question} answer={answer} />
          ))}
        </div>
      </section>
    </main>
  )
}
