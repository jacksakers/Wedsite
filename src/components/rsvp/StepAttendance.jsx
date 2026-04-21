import { MEAL_OPTIONS } from '../../constants/weddingInfo'

export default function StepAttendance({ party, attendance, onChange, onNext, onBack }) {
  const allAnswered = party.every((_, i) => attendance[i]?.attending !== undefined)

  function toggle(index, attending) {
    const updated = [...attendance]
    updated[index] = { ...updated[index], name: party[index].name, attending }
    onChange(updated)
  }

  function setMeal(index, meal) {
    const updated = [...attendance]
    updated[index] = { ...updated[index], meal }
    onChange(updated)
  }

  return (
    <div>
      <h2 className="font-serif text-palmetto text-3xl mb-2 text-center">
        Will You Be Attending?
      </h2>
      <p className="font-sans text-sage text-sm text-center mb-8">
        Please respond for each member of your party.
      </p>

      <div className="space-y-6 mb-8">
        {party.map((member, i) => (
          <div key={member.name} className="border border-sage/20 rounded-lg p-5 bg-sage/5">
            <p className="font-serif text-palmetto text-xl mb-4">{member.name}</p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => toggle(i, true)}
                className={`flex-1 py-2 rounded text-xs font-sans uppercase tracking-widest transition-colors border ${
                  attendance[i]?.attending === true
                    ? 'bg-palmetto text-paper border-palmetto'
                    : 'bg-transparent text-sage border-sage/40 hover:border-palmetto hover:text-palmetto'
                }`}
              >
                Joyfully Accepts
              </button>
              <button
                onClick={() => toggle(i, false)}
                className={`flex-1 py-2 rounded text-xs font-sans uppercase tracking-widest transition-colors border ${
                  attendance[i]?.attending === false
                    ? 'bg-sage text-paper border-sage'
                    : 'bg-transparent text-sage border-sage/40 hover:border-sage hover:text-sage'
                }`}
              >
                Regretfully Declines
              </button>
            </div>

            {attendance[i]?.attending === true && (
              <div>
                <p className="font-sans text-xs tracking-widest uppercase text-sage/70 mb-2">
                  Meal Preference
                </p>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_OPTIONS.map(option => (
                    <button
                      key={option}
                      onClick={() => setMeal(i, option)}
                      className={`px-4 py-1.5 rounded-full text-xs font-sans transition-colors border ${
                        attendance[i]?.meal === option
                          ? 'bg-sunrise-orange text-paper border-sunrise-orange'
                          : 'bg-transparent text-sage border-sage/40 hover:border-sunrise-orange hover:text-sunrise-orange'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
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
          disabled={!allAnswered}
          className="flex-1 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
