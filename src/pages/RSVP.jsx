import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getGroupRSVPs, submitRSVP } from '../hooks/useRSVP'
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

const EMPTY_DETAILS = {
  notes: '',
  phone: '',
  addressLine1: '',
  addressCity: '',
  addressState: '',
  addressZip: '',
}

function indexResponsesById(responses) {
  return responses.reduce((acc, response) => {
    acc[response.guestId ?? response.id] = response
    return acc
  }, {})
}

export default function RSVP() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [guest, setGuest] = useState(null)
  const [groupResponses, setGroupResponses] = useState({})
  const [groupAttendance, setGroupAttendance] = useState({})
  const [details, setDetails] = useState(EMPTY_DETAILS)
  const [loadingGuest, setLoadingGuest] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleGuestFound(foundGuest) {
    setSubmitError('')
    setLoadingGuest(true)

    try {
      const responses = await getGroupRSVPs(foundGuest.groupId ?? foundGuest.id)
      const responseMap = indexResponsesById(responses)
      const existingResponse = responseMap[foundGuest.id]

      setGuest(foundGuest)
      setGroupResponses(responseMap)

      const partyMembers = foundGuest.party ?? [{ guestId: foundGuest.id, name: foundGuest.name }]
      const initialGroupAttendance = {}
      partyMembers.forEach(member => {
        const response = responseMap[member.guestId]
        if (response) initialGroupAttendance[member.guestId] = response.attending
      })
      setGroupAttendance(initialGroupAttendance)

      setDetails(responseMap[foundGuest.id]
        ? {
            notes: existingResponse.notes ?? '',
            phone: existingResponse.phone ?? '',
            addressLine1: existingResponse.addressLine1 ?? '',
            addressCity: existingResponse.addressCity ?? '',
            addressState: existingResponse.addressState ?? '',
            addressZip: existingResponse.addressZip ?? '',
          }
        : EMPTY_DETAILS)
      setStep(2)
    } catch {
      setSubmitError('We found your invitation, but could not load your group right now. Please check your connection and try again.')
    } finally {
      setLoadingGuest(false)
    }
  }

  async function handleSubmit() {
    if (!guest || groupAttendance[guest.id] === undefined) return

    setSubmitError('')
    setSubmitting(true)
    try {
      const partyMembers = guest.party ?? [{ guestId: guest.id, name: guest.name }]
      const groupId = guest.groupId ?? guest.id

      await Promise.all(
        partyMembers
          .filter(member => groupAttendance[member.guestId] !== undefined)
          .map(member => {
            const isCurrentGuest = member.guestId === guest.id
            return submitRSVP(member.guestId, {
              guestId: member.guestId,
              guestName: member.name,
              groupId,
              attending: groupAttendance[member.guestId],
              ...(isCurrentGuest ? details : {}),
              uid: user?.uid ?? null,
            })
          })
      )

      setGroupResponses(prev => {
        const next = { ...prev }
        partyMembers
          .filter(member => groupAttendance[member.guestId] !== undefined)
          .forEach(member => {
            const isCurrentGuest = member.guestId === guest.id
            next[member.guestId] = {
              ...(isCurrentGuest ? details : {}),
              guestId: member.guestId,
              guestName: member.name,
              groupId,
              attending: groupAttendance[member.guestId],
              uid: user?.uid ?? null,
            }
          })
        return next
      })
      setStep(4)
    } catch {
      setSubmitError('Something went wrong submitting your RSVP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="bg-paper min-h-[80svh] mb-10">
      <section className="bg-palmetto py-16 px-6 text-center velvet-surface mb-12">
        <h1 className="font-serif text-paper text-5xl md:text-6xl mb-4 text-gilt">RSVP</h1>
        <p className="font-sans text-paper/70 text-xs tracking-[0.25em] uppercase">
          Kindly reply by {RSVP_DEADLINE}
        </p>
      </section>

      <section className="py-16 px-6 max-w-2xl mx-auto paper-lift">
        {step < 4 && <StepIndicator current={step} />}

        {step === 1 && (
          <>
            <StepLookup onFound={handleGuestFound} />
            {(loadingGuest || submitError) && (
              <p className={`font-sans text-sm mt-4 text-center ${submitError ? 'text-red-500' : 'text-sage'}`}>
                {loadingGuest ? 'Loading your group…' : submitError}
              </p>
            )}
          </>
        )}

        {step === 2 && guest && (
          <StepAttendance
            guestId={guest.id}
            guestName={guest.name}
            party={guest.party ?? [{ guestId: guest.id, name: guest.name }]}
            groupAttendance={groupAttendance}
            onGroupAttendanceChange={(id, value) =>
              setGroupAttendance(prev => ({ ...prev, [id]: value }))
            }
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
          <StepConfirmation guestName={guest.name} attending={groupAttendance[guest.id] === true} />
        )}
      </section>
    </main>
  )
}
