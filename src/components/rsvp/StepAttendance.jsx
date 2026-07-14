export default function StepAttendance({
  guestId,
  guestName,
  party,
  groupAttendance,
  onGroupAttendanceChange,
  onNext,
  onBack,
}) {
  const allPartyMembers = Array.isArray(party) && party.length > 0
    ? party
    : [{ guestId, name: guestName }]

  return (
    <div>
      <h2 className="font-serif text-palmetto text-3xl mb-2 text-center">
        Will You Be Attending?
      </h2>
      <p className="font-sans text-sage text-sm text-center mb-8">
        RSVP for yourself, and optionally for anyone else in your group.
      </p>

      <div className="space-y-6 mb-8">
        {allPartyMembers.map(member => {
          const memberAttendance = groupAttendance[member.guestId]
          const isCurrentGuest = member.guestId === guestId

          return (
            <div key={member.guestId ?? member.name} className="border border-sage/20 rounded-lg p-5 bg-sage/5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="font-serif text-palmetto text-xl">{member.name}</p>
                {isCurrentGuest && (
                  <span className="font-sans text-[10px] tracking-widest uppercase text-sunrise-orange">
                    You
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onGroupAttendanceChange(member.guestId, true)}
                  className={`flex-1 py-2 rounded text-xs font-sans uppercase tracking-widest transition-colors border ${
                    memberAttendance === true
                      ? 'bg-palmetto text-paper border-palmetto'
                      : 'bg-transparent text-sage border-sage/40 hover:border-palmetto hover:text-palmetto'
                  }`}
                >
                  Joyfully Accepts
                </button>
                <button
                  onClick={() => onGroupAttendanceChange(member.guestId, false)}
                  className={`flex-1 py-2 rounded text-xs font-sans uppercase tracking-widest transition-colors border ${
                    memberAttendance === false
                      ? 'bg-sage text-paper border-sage'
                      : 'bg-transparent text-sage border-sage/40 hover:border-sage hover:text-sage'
                  }`}
                >
                  Regretfully Declines
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 text-xs font-sans uppercase tracking-widest text-sage border border-sage/40 rounded hover:border-palmetto hover:text-palmetto transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={groupAttendance[guestId] === undefined}
          className="flex-1 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
