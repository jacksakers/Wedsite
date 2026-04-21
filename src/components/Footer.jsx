import { Link } from 'react-router-dom'
import { COUPLE_DISPLAY } from '../constants/weddingInfo'

export default function Footer() {
  return (
    <footer className="bg-palmetto text-paper/70 py-12 px-6 mt-auto velvet-surface paper-edge-top">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
        <p className="font-serif text-paper text-2xl tracking-wide">{COUPLE_DISPLAY}</p>
        <p className="font-sans text-xs tracking-[0.2em] uppercase text-paper/50">
          March 13, 2027 · Irmo, South Carolina
        </p>
        <div className="flex gap-6 mt-2">
          {[
            { label: 'Details', to: '/information' },
            { label: 'Registry', to: '/registry' },
            { label: 'RSVP', to: '/rsvp' },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-xs uppercase tracking-widest text-paper/60 hover:text-paper transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-paper/30 mt-4">
          Made with love · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
