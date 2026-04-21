import { Link } from 'react-router-dom'
import { COUPLE_DISPLAY } from '../../constants/weddingInfo'

export default function StepConfirmation({ guestName, anyAttending }) {
  return (
    <div className="text-center py-10">
      <div className="w-16 h-px bg-sunrise-pink mx-auto mb-10" />

      <h2 className="font-serif text-palmetto text-4xl mb-4">
        {anyAttending ? "We'll see you there!" : "We'll miss you!"}
      </h2>

      <p className="font-sans text-sage leading-relaxed mb-4 max-w-sm mx-auto">
        {anyAttending
          ? `Thank you, ${guestName}. We can't wait to celebrate with you on March 13, 2027.`
          : `Thank you for letting us know, ${guestName}. We'll be thinking of you and are so grateful for your love and support.`}
      </p>

      <p className="font-sans text-sage/50 text-xs mb-10">
        Need to make a change? Reach out to {COUPLE_DISPLAY} directly.
      </p>

      <div className="w-16 h-px bg-sunrise-pink mx-auto mb-10" />

      <Link
        to="/"
        className="inline-block bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-8 rounded hover:bg-palmetto/80 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}
