export default function StepDetails({ values, onChange, onSubmit, onBack, loading }) {
  return (
    <div>
      <h2 className="font-serif text-palmetto text-3xl mb-2 text-center">
        A Few More Details
      </h2>
      <p className="font-sans text-sage text-sm text-center mb-8">
        Almost there — just a couple of fun extras.
      </p>

      <div className="space-y-6 mb-8">
        <div>
          <label className="font-sans text-xs tracking-widest uppercase text-sage/70 block mb-2">
            Song Request
          </label>
          <input
            type="text"
            value={values.songRequest}
            onChange={e => onChange({ ...values, songRequest: e.target.value })}
            placeholder="What song will get you on the dance floor?"
            className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
        </div>

        <div>
          <label className="font-sans text-xs tracking-widest uppercase text-sage/70 block mb-2">
            Dietary Restrictions or Allergies
          </label>
          <textarea
            value={values.notes}
            onChange={e => onChange({ ...values, notes: e.target.value })}
            placeholder="Let us know about any allergies or dietary needs for your party."
            rows={3}
            className="w-full border border-sage/40 rounded px-4 py-3 font-sans text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 text-xs font-sans uppercase tracking-widest text-sage border border-sage/40 rounded hover:border-palmetto hover:text-palmetto transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-3 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit RSVP'}
        </button>
      </div>
    </div>
  )
}
