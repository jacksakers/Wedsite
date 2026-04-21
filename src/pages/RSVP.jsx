import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { submitRSVP } from '../hooks/useRSVP'
import { RSVP_DEADLINE } from '../constants/weddingInfo'
import StepLookup from '../components/rsvp/StepLookup'
import StepAttendance from '../components/rsvp/StepAttendance'
import StepDetails from '../components/rsvp/StepDetails'
import StepConfirmation from '../components/rsvp/StepConfirmation'

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-12">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-bold transition-colors ${
              s < current
                ? 'bg-sage text-paper'
                : s === current
                ? 'bg-palmetto text-paper'
                : 'bg-sage/20 text-sage'
            }`}
          >
            {s < current ? '✓' : s}
          </div>
          {s < 3 && (
            <div className={`w-8 h-px transition-colors ${s < current ? 'bg-sage' : 'bg-sage/20'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function RSVP() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [guest, setGuest] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [details, setDetails] = useState({ songRequest: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handleGuestFound(foundGuest) {
    setGuest(foundGuest)
    setAttendance(foundGuest.party.map(p => ({ name: p.name, attending: undefined, meal: '' })))
    setStep(2)
  }

  async function handleSubmit() {
    setSubmitError('')
    setSubmitting(true)
    try {
      await submitRSVP(guest.id, {
        guestId: guest.id,
        guestName: guest.name,
        partyAttendance: attendance,
        ...details,
        uid: user?.uid ?? null,
      })
      setStep(4)
    } catch {
      setSubmitError('Something went wrong submitting your RSVP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const anyAttending = attendance.some(a => a.attending === true)

  return (
    <main className="bg-paper min-h-[80svh]">
      <section className="bg-palmetto py-16 px-6 text-center velvet-surface">
        <h1 className="font-serif text-paper text-5xl md:text-6xl mb-4 text-gilt">RSVP</h1>
        <p className="font-sans text-paper/70 text-xs tracking-[0.25em] uppercase">
          Kindly reply by {RSVP_DEADLINE}
        </p>
      </section>

      <section className="py-16 px-6 max-w-2xl mx-auto paper-lift">
        {step < 4 && <StepIndicator current={step} />}

        {step === 1 && <StepLookup onFound={handleGuestFound} />}

        {step === 2 && guest && (
          <StepAttendance
            party={guest.party}
            attendance={attendance}
            onChange={setAttendance}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <>
            <StepDetails
              values={details}
              onChange={setDetails}
              onSubmit={handleSubmit}
              onBack={() => setStep(2)}
              loading={submitting}
            />
            {submitError && (
              <p className="font-sans text-red-500 text-sm mt-4 text-center">{submitError}</p>
            )}
          </>
        )}

        {step === 4 && guest && (
          <StepConfirmation guestName={guest.name} anyAttending={anyAttending} />
        )}
      </section>
    </main>
  )
}
