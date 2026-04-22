import { useState, useEffect } from 'react'
import { getOurStory, saveOurStory, DEFAULT_MILESTONES } from '../../../hooks/useOurStory'
import PhotoPickerModal from '../../../components/PhotoPickerModal'

const genId = () => crypto.randomUUID()

const INPUT = 'border border-sage/30 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/40'
const TEXTAREA = `${INPUT} resize-y`

function moveItem(arr, index, dir) {
  const next = [...arr]
  const target = index + dir
  if (target < 0 || target >= next.length) return arr
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function MilestoneCard({ milestone, index, total, onChange, onMove, onDelete, onPickPhoto }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-sage/20 rounded-lg overflow-hidden bg-paper">
      {/* Card header — click to expand */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-sage/5 transition-colors select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="font-sans text-sage/40 text-xs w-5 text-center shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sunrise-orange text-xs tracking-[0.15em] uppercase truncate">
            {milestone.season || '—'}
          </p>
          <p className="font-serif text-palmetto text-sm truncate">
            {milestone.title || 'Untitled milestone'}
          </p>
        </div>
        {milestone.photoUrl && (
          <img src={milestone.photoUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0 border border-sage/20" />
        )}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(-1)} disabled={index === 0} className="text-sage/40 hover:text-sage disabled:opacity-20 px-1" title="Move up">↑</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-sage/40 hover:text-sage disabled:opacity-20 px-1" title="Move down">↓</button>
          <button onClick={onDelete} className="text-red-400 hover:text-red-600 px-1 ml-1" title="Delete">✕</button>
        </div>
        <span className="font-sans text-sage/40 text-xs shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-sage/10 flex flex-col gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs text-sage/60 uppercase tracking-wide block mb-1">Season / Date</label>
              <input
                value={milestone.season}
                onChange={e => onChange('season', e.target.value)}
                placeholder="e.g. Spring 2023"
                className={`${INPUT} w-full`}
              />
            </div>
            <div>
              <label className="font-sans text-xs text-sage/60 uppercase tracking-wide block mb-1">Title</label>
              <input
                value={milestone.title}
                onChange={e => onChange('title', e.target.value)}
                placeholder="Milestone title"
                className={`${INPUT} w-full`}
              />
            </div>
          </div>

          <div>
            <label className="font-sans text-xs text-sage/60 uppercase tracking-wide block mb-1">Story</label>
            <textarea
              value={milestone.body}
              onChange={e => onChange('body', e.target.value)}
              placeholder="Tell this part of the story…"
              rows={4}
              className={`${TEXTAREA} w-full`}
            />
          </div>

          <div>
            <label className="font-sans text-xs text-sage/60 uppercase tracking-wide block mb-1">Photo</label>
            {milestone.photoUrl ? (
              <div className="flex items-start gap-3">
                <img
                  src={milestone.photoUrl}
                  alt="Milestone"
                  className="w-24 h-24 object-cover rounded border border-sage/20 shrink-0"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={onPickPhoto}
                    className="font-sans text-xs tracking-[0.15em] uppercase border border-sage/40 text-sage px-4 py-2 rounded hover:border-sage hover:text-palmetto transition-colors"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={() => onChange('photoUrl', null)}
                    className="font-sans text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={onPickPhoto}
                  className="font-sans text-xs tracking-[0.15em] uppercase border border-dashed border-sage/40 text-sage px-5 py-2.5 rounded hover:border-sage hover:text-palmetto transition-colors"
                >
                  + Set Photo
                </button>
                {milestone.imageHint && (
                  <p className="font-sans text-sage/50 text-xs mt-2 italic">{milestone.imageHint}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OurStoryTab() {
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [pickerIndex, setPickerIndex] = useState(null)

  useEffect(() => {
    getOurStory()
      .then(data => setMilestones(data.milestones))
      .catch(() => setError('Failed to load story.'))
      .finally(() => setLoading(false))
  }, [])

  function updateMilestone(index, field, value) {
    setMilestones(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  function addMilestone() {
    const newM = {
      id: genId(),
      season: '',
      title: 'New Milestone',
      body: '',
      imageHint: '',
      photoUrl: null,
    }
    setMilestones(prev => [...prev, newM])
  }

  function deleteMilestone(index) {
    if (!window.confirm('Delete this milestone?')) return
    setMilestones(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await saveOurStory(milestones)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="font-sans text-sage py-10 text-center">Loading story…</p>

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-serif text-palmetto text-2xl text-pressed">Our Story</h2>
          <p className="font-sans text-sage text-xs mt-1">
            Edit milestones, add photos, reorder or delete — then save when ready.
          </p>
        </div>
        <a
          href="/story"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs tracking-[0.15em] uppercase border border-sage/40 text-sage px-4 py-2 rounded hover:border-sage hover:text-palmetto transition-colors shrink-0"
        >
          Preview Page ↗
        </a>
      </div>

      {error && <p className="font-sans text-red-500 text-sm mb-4">{error}</p>}

      {/* Milestone list */}
      <div className="flex flex-col gap-2 mb-4">
        {milestones.map((m, i) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            index={i}
            total={milestones.length}
            onChange={(field, val) => updateMilestone(i, field, val)}
            onMove={dir => setMilestones(prev => moveItem(prev, i, dir))}
            onDelete={() => deleteMilestone(i)}
            onPickPhoto={() => setPickerIndex(i)}
          />
        ))}
      </div>

      {/* Add milestone */}
      <button
        onClick={addMilestone}
        className="w-full font-sans text-xs text-sage hover:text-palmetto tracking-wide uppercase border border-dashed border-sage/30 hover:border-sage/60 rounded px-4 py-3 transition-colors mb-6"
      >
        + Add Milestone
      </button>

      {/* Save */}
      <div className="flex items-center gap-4 pt-5 border-t border-sage/20">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2.5 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Story'}
        </button>
        {saved && <p className="font-sans text-sage text-xs">Story saved ✓</p>}
      </div>

      {/* Photo picker modal */}
      {pickerIndex !== null && (
        <PhotoPickerModal
          onSelect={url => {
            updateMilestone(pickerIndex, 'photoUrl', url)
            setPickerIndex(null)
          }}
          onClose={() => setPickerIndex(null)}
        />
      )}
    </div>
  )
}
