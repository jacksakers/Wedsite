const milestones = [
  {
    id: 1,
    season: 'Spring 2023',
    title: 'A Rainy Day at Cool Beans',
    body: 'It started with coffee. Jack ordered black, naturally. Kelsey got a cinnamon-spiced cider. They met at Cool Beans — a little café just off the Horseshoe at the University of South Carolina — on a perfectly rainy afternoon. He gave her a silly band, they debated their favorite childhood Disney shows, landed on Dog with a Blog, and both ended up skipping class. The conversation that started that afternoon has never really ended.',
    imageHint: 'Cool Beans café or the Horseshoe at UofSC',
  },
  {
    id: 2,
    season: 'Spring 2023',
    title: 'The First Dates',
    body: 'Dinners around Columbia followed — Green Olive was a favorite — and eventually a home-cooked meal. It was early, but something was unmistakably clear: this was worth showing up for, again and again.',
    imageHint: 'An early date photo — dinner out or a candid together',
  },
  {
    id: 3,
    season: 'Valentine\'s Day',
    title: 'The Otter',
    body: 'For their first Valentine\'s Day together, Jack hand-painted Kelsey an otter. It was their first real gift to each other, and it landed. River otters — playful, loyal, and joyful — became the quiet symbol of their relationship, and they\'ve held that meaning ever since.',
    imageHint: 'The hand-painted otter, or an otter keepsake',
  },
  {
    id: 4,
    season: 'Spring 2023',
    title: 'Formals, Football & "I Love You"',
    body: 'Junior year meant football Saturdays, frat parties, and formals. Meeting each other\'s roommates, merging friend groups, and making memories at every turn. At one of their formals, dressed up and surrounded by friends, Jack told Kelsey he loved her for the first time.',
    imageHint: 'A formal or game day photo from junior year',
  },
  {
    id: 5,
    season: 'Summer 2023',
    title: 'The Summer They Stayed',
    body: 'Jack stayed in Columbia that summer, which meant lazy days, late nights, and a lot of quality time. He introduced Kelsey to his drum kit (she can confirm he provided the drums). She kept her plants at his place. The hours passed the way they always did between them — easily, and all at once.',
    imageHint: 'A summer candid — porch, backyard, or around Columbia',
  },
  {
    id: 6,
    season: 'Fall 2023 – Spring 2024',
    title: 'Senior Year',
    body: 'Senior year was everything it should have been: football games together, midnight breakfast at the Russell House, cheering on the Gamecocks women\'s basketball team, and studying side-by-side before exams. Their friend groups fully merged, two worlds became one, and a lot of good evenings were had.',
    imageHint: 'Senior year photos — game day, friends, campus, or graduation',
  },
  {
    id: 7,
    season: 'Summer 2024',
    title: 'Graduation & Europe: The First Trip',
    body: 'They graduated from the University of South Carolina and celebrated with passports. A hostel in Ireland, city centers in Switzerland and France, chocolate in Belgium, and a wander through Bruges. They went as two people who loved each other and came back knowing something equally important: they travel beautifully together.',
    imageHint: 'Europe trip 1 — Ireland, Belgium, France, or Switzerland',
  },
  {
    id: 8,
    season: 'Summer 2025',
    title: 'Europe: The Second Trip',
    body: 'Spain and Portugal called, and they answered. This trip leaned into the landscape — long hikes, medieval castles, and slow afternoons on the coast. A different Europe, the same easy rhythm.',
    imageHint: 'Europe trip 2 — Spain or Portugal landscapes',
  },
  {
    id: 9,
    season: 'September 2025',
    title: 'Coming Home',
    body: 'After years of separate apartments and shared neighborhoods, they found a house in Columbia and made it theirs — plants, drum kit, and all.',
    imageHint: 'A photo of the house or moving day',
  },
  {
    id: 10,
    season: 'November 10, 2025',
    title: 'Quade',
    body: 'On a Monday in November, they drove out to a Petsmart and came home with Quade — part Maine Coon, entirely perfect. He is their one and only begotten son, and the feeling is entirely mutual.',
    imageHint: 'A photo of Quade the cat',
  },
  {
    id: 11,
    season: 'March 14, 2026',
    title: '"Will You Marry Me?"',
    body: 'On their three-year anniversary, at Playa Okatao in Costa Rica, Jack proposed. The same conversation that began at a rainy coffee shop near the Horseshoe — the one that made them both skip class — became a promise for a lifetime.',
    imageHint: 'Engagement photos from Playa Okatao, Costa Rica',
  },
]

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
      <p className="font-sans text-sage/45 text-xs text-center px-6 leading-relaxed italic">
        {hint}
      </p>
    </div>
  )
}

export default function OurStory() {
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
                    <ImagePlaceholder hint={m.imageHint} />
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
