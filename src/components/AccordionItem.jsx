import { useState } from 'react'

export default function AccordionItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-sage/30">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
      >
        <span className="font-serif text-palmetto text-lg">{question}</span>
        <span
          className={`text-sage transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-45' : ''
          }`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="8" y1="0" x2="8" y2="16" />
            <line x1="0" y1="8" x2="16" y2="8" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="pb-5 font-sans text-sage leading-relaxed text-sm">
          {answer}
        </div>
      )}
    </div>
  )
}
