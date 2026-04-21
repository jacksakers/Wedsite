import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { COUPLE_DISPLAY } from '../constants/weddingInfo'

const NAV_LINKS = [
  { label: 'Our Story', to: '/story' },
  { label: 'Details', to: '/information' },
  { label: 'Registry', to: '/registry' },
  { label: 'RSVP', to: '/rsvp' },
]

const navLinkClass = ({ isActive }) =>
  `text-xs tracking-[0.2em] uppercase transition-colors duration-200 ${
    isActive ? 'text-palmetto font-bold' : 'text-sage hover:text-palmetto'
  }`

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-[150] bg-paper/95 backdrop-blur-sm border-b border-sage/20 shadow-sm paper-lift">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        <Link
          to="/"
          className="font-serif text-xl text-palmetto tracking-wide hover:text-palmetto/80 transition-colors"
        >
          {COUPLE_DISPLAY}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 flex flex-col justify-center gap-[5px]"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          <span
            className={`block h-0.5 w-6 bg-palmetto origin-center transition-transform duration-200 ${
              isOpen ? 'translate-y-[7px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-palmetto transition-opacity duration-200 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-palmetto origin-center transition-transform duration-200 ${
              isOpen ? '-translate-y-[7px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <nav
          className="md:hidden bg-paper border-t border-sage/20 px-6 py-5"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-5">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={navLinkClass}
                  onClick={() => setIsOpen(false)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
