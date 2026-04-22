// TODO: Replace href values with your actual registry links before launch.
const REGISTRIES = [
  {
    name: 'Zola',
    description: 'Our primary registry with home essentials, experiences, and more.',
    href: 'https://www.zola.com',
    cta: 'View on Zola',
  },
  {
    name: 'Target',
    description: 'Everyday home goods and essentials.',
    href: 'https://www.target.com/gift-registry',
    cta: 'View on Target',
  },
]

export default function Registry() {
  return (
    <main className="bg-paper">
      {/* Page Header */}
      <section className="bg-palmetto py-20 px-6 text-center velvet-surface">
        <h1 className="font-serif text-paper text-5xl md:text-6xl mb-4 text-gilt">Registry</h1>
        <p className="font-sans text-paper/70 text-xs tracking-[0.25em] uppercase">
          Your presence is the greatest gift
        </p>
      </section>

      <section className="py-20 px-6 max-w-3xl mx-auto">
        <p className="font-sans text-sage text-center leading-relaxed mb-16 max-w-xl mx-auto">
          We are truly grateful just to celebrate this day with you. If you'd like to give a gift,
          we've curated a few options below. Thank you from the bottom of our hearts.
        </p>

        {/* Registry Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {REGISTRIES.map(({ name, description, href, cta }) => (
            <div
              key={name}
              className="bg-sage/10 rounded-lg p-8 border border-sage/20 flex flex-col paper-lift"
            >
              <h2 className="font-serif text-palmetto text-2xl mb-2 text-pressed">{name}</h2>
              <p className="font-sans text-sage text-sm leading-relaxed flex-1 mb-6">
                {description}
              </p>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors"
              >
                {cta}
              </a>
            </div>
          ))}
        </div>

        {/* Future Home Fund */}
        <div className="bg-sunrise-pink/20 border border-sunrise-pink/40 rounded-lg p-8 text-center paper-lift">
          <p className="font-sans text-sunrise-orange text-xs tracking-[0.25em] uppercase mb-3">
            Most Appreciated
          </p>
          <h2 className="font-serif text-palmetto text-3xl mb-4 text-pressed">Future Home Fund</h2>
          <p className="font-sans text-sage text-sm leading-relaxed mb-6 max-w-md mx-auto">
            We're dreaming of a cozy and welcoming home to start building our family. A contribution to our future home fund
            would mean the world to us.
          </p>
          {/* TODO: Replace with a real Stripe Payment Link or Venmo/PayPal link */}
          <a
            href="#"
            className="inline-block bg-sunrise-orange text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-8 rounded hover:bg-sunrise-orange/80 transition-colors"
          >
            Contribute to Our Home
          </a>
          <p className="font-sans text-sage/60 text-xs mt-4">Secure payment via Stripe — coming soon</p>
        </div>
      </section>
    </main>
  )
}
