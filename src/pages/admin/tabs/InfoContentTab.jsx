import { useState, useEffect } from 'react'
import {
  getSiteContent,
  saveSiteSection,
  DEFAULT_SCHEDULE,
  DEFAULT_HOTELS,
  DEFAULT_COLUMBIA_GUIDE,
  DEFAULT_FAQS,
} from '../../../hooks/useSiteContent'

const genId = () => crypto.randomUUID()

// ─── Shared helpers ───────────────────────────────────────────────────────────

function moveItem(arr, index, dir) {
  const next = [...arr]
  const target = index + dir
  if (target < 0 || target >= next.length) return arr
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function RowActions({ index, total, onMoveUp, onMoveDown, onDelete }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={onMoveUp} disabled={index === 0} className="text-sage/50 hover:text-sage disabled:opacity-20 px-1" title="Move up">↑</button>
      <button onClick={onMoveDown} disabled={index === total - 1} className="text-sage/50 hover:text-sage disabled:opacity-20 px-1" title="Move down">↓</button>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 px-1 ml-1" title="Delete">✕</button>
    </div>
  )
}

function SaveBar({ section, saving, saved, onSave }) {
  return (
    <div className="flex items-center gap-4 mt-6 pt-5 border-t border-sage/20">
      <button
        onClick={onSave}
        disabled={saving === section}
        className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2.5 px-6 rounded hover:bg-palmetto/80 transition-colors disabled:opacity-50"
      >
        {saving === section ? 'Saving…' : 'Save Section'}
      </button>
      {saved === section && (
        <p className="font-sans text-sage text-xs">Saved ✓</p>
      )}
    </div>
  )
}

const INPUT = 'border border-sage/30 rounded px-3 py-2 font-sans text-palmetto bg-paper text-sm focus:outline-none focus:ring-2 focus:ring-sage/40'
const TEXTAREA = `${INPUT} resize-y min-h-[60px]`

// ─── Schedule ─────────────────────────────────────────────────────────────────

function ScheduleSection({ items, setItems, saving, saved, onSave }) {
  function update(i, field, val) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  function add() {
    setItems(prev => [...prev, { id: genId(), time: '', event: '', note: '' }])
  }

  return (
    <div>
      <p className="font-sans text-sage text-xs mb-5 leading-relaxed">
        Edit the day-of schedule. Items appear in order on the Details page.
      </p>
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <div key={it.id} className="border border-sage/20 rounded-lg p-4 bg-paper">
            <div className="flex gap-2 mb-2">
              <input value={it.time} onChange={e => update(i, 'time', e.target.value)} placeholder="Time (e.g. 3:00 PM)" className={`${INPUT} w-36`} />
              <input value={it.event} onChange={e => update(i, 'event', e.target.value)} placeholder="Event name" className={`${INPUT} flex-1`} />
              <RowActions index={i} total={items.length} onMoveUp={() => setItems(prev => moveItem(prev, i, -1))} onMoveDown={() => setItems(prev => moveItem(prev, i, 1))} onDelete={() => setItems(prev => prev.filter((_, idx) => idx !== i))} />
            </div>
            <input value={it.note} onChange={e => update(i, 'note', e.target.value)} placeholder="Note (optional)" className={`${INPUT} w-full`} />
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 font-sans text-xs text-sage hover:text-palmetto tracking-wide uppercase border border-dashed border-sage/30 hover:border-sage/60 rounded px-4 py-2 transition-colors w-full">
        + Add Event
      </button>
      <SaveBar section="schedule" saving={saving} saved={saved} onSave={onSave} />
    </div>
  )
}

// ─── Hotels ───────────────────────────────────────────────────────────────────

function HotelsSection({ items, setItems, saving, saved, onSave }) {
  function update(i, field, val) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  function add() {
    setItems(prev => [...prev, { id: genId(), name: '', distance: '', note: '', href: '' }])
  }

  return (
    <div>
      <p className="font-sans text-sage text-xs mb-5 leading-relaxed">
        Add hotel blocks and lodging recommendations. Each card links to a booking URL.
      </p>
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <div key={it.id} className="border border-sage/20 rounded-lg p-4 bg-paper">
            <div className="flex gap-2 mb-2">
              <input value={it.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Hotel name" className={`${INPUT} flex-1`} />
              <input value={it.distance} onChange={e => update(i, 'distance', e.target.value)} placeholder="Distance (e.g. 5 min drive)" className={`${INPUT} w-44`} />
              <RowActions index={i} total={items.length} onMoveUp={() => setItems(prev => moveItem(prev, i, -1))} onMoveDown={() => setItems(prev => moveItem(prev, i, 1))} onDelete={() => setItems(prev => prev.filter((_, idx) => idx !== i))} />
            </div>
            <input value={it.note} onChange={e => update(i, 'note', e.target.value)} placeholder="Note shown to guests" className={`${INPUT} w-full mb-2`} />
            <input value={it.href} onChange={e => update(i, 'href', e.target.value)} placeholder="Booking URL (https://…)" className={`${INPUT} w-full`} />
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 font-sans text-xs text-sage hover:text-palmetto tracking-wide uppercase border border-dashed border-sage/30 hover:border-sage/60 rounded px-4 py-2 transition-colors w-full">
        + Add Hotel
      </button>
      <SaveBar section="hotels" saving={saving} saved={saved} onSave={onSave} />
    </div>
  )
}

// ─── Columbia Guide ───────────────────────────────────────────────────────────

function GuideSection({ items, setItems, saving, saved, onSave }) {
  function updateCategory(i, val) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, category: val } : it))
  }
  function updateItem(catIdx, itemIdx, val) {
    setItems(prev => prev.map((cat, ci) => {
      if (ci !== catIdx) return cat
      const newItems = cat.items.map((item, ii) => ii === itemIdx ? val : item)
      return { ...cat, items: newItems }
    }))
  }
  function addItem(catIdx) {
    setItems(prev => prev.map((cat, ci) => ci === catIdx ? { ...cat, items: [...cat.items, ''] } : cat))
  }
  function removeItem(catIdx, itemIdx) {
    setItems(prev => prev.map((cat, ci) => ci !== catIdx ? cat : { ...cat, items: cat.items.filter((_, ii) => ii !== itemIdx) }))
  }
  function moveItemInCat(catIdx, itemIdx, dir) {
    setItems(prev => prev.map((cat, ci) => ci !== catIdx ? cat : { ...cat, items: moveItem(cat.items, itemIdx, dir) }))
  }
  function addCategory() {
    setItems(prev => [...prev, { id: genId(), category: '', items: [''] }])
  }

  return (
    <div>
      <p className="font-sans text-sage text-xs mb-5 leading-relaxed">
        Organize recommendations into categories. Each category shows as a column on the Details page.
      </p>
      <div className="flex flex-col gap-4">
        {items.map((cat, ci) => (
          <div key={cat.id} className="border border-sage/20 rounded-lg p-4 bg-paper">
            <div className="flex gap-2 mb-3">
              <input value={cat.category} onChange={e => updateCategory(ci, e.target.value)} placeholder="Category name (e.g. Restaurants)" className={`${INPUT} flex-1`} />
              <RowActions index={ci} total={items.length} onMoveUp={() => setItems(prev => moveItem(prev, ci, -1))} onMoveDown={() => setItems(prev => moveItem(prev, ci, 1))} onDelete={() => { if (window.confirm('Delete this category and all its items?')) setItems(prev => prev.filter((_, idx) => idx !== ci)) }} />
            </div>
            <div className="flex flex-col gap-1.5 ml-2">
              {cat.items.map((item, ii) => (
                <div key={ii} className="flex gap-2 items-center">
                  <input value={item} onChange={e => updateItem(ci, ii, e.target.value)} placeholder="Item" className={`${INPUT} flex-1`} />
                  <button onClick={() => moveItemInCat(ci, ii, -1)} disabled={ii === 0} className="text-sage/40 hover:text-sage disabled:opacity-20 px-1">↑</button>
                  <button onClick={() => moveItemInCat(ci, ii, 1)} disabled={ii === cat.items.length - 1} className="text-sage/40 hover:text-sage disabled:opacity-20 px-1">↓</button>
                  <button onClick={() => removeItem(ci, ii)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                </div>
              ))}
              <button onClick={() => addItem(ci)} className="mt-1 font-sans text-xs text-sage/60 hover:text-sage tracking-wide text-left transition-colors">
                + Add item
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addCategory} className="mt-3 font-sans text-xs text-sage hover:text-palmetto tracking-wide uppercase border border-dashed border-sage/30 hover:border-sage/60 rounded px-4 py-2 transition-colors w-full">
        + Add Category
      </button>
      <SaveBar section="guide" saving={saving} saved={saved} onSave={onSave} />
    </div>
  )
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

function FaqsSection({ items, setItems, saving, saved, onSave }) {
  function update(i, field, val) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  }
  function add() {
    setItems(prev => [...prev, { id: genId(), question: '', answer: '' }])
  }

  return (
    <div>
      <p className="font-sans text-sage text-xs mb-5 leading-relaxed">
        Edit the frequently asked questions shown at the bottom of the Details page.
      </p>
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <div key={it.id} className="border border-sage/20 rounded-lg p-4 bg-paper">
            <div className="flex gap-2 mb-2">
              <input value={it.question} onChange={e => update(i, 'question', e.target.value)} placeholder="Question" className={`${INPUT} flex-1`} />
              <RowActions index={i} total={items.length} onMoveUp={() => setItems(prev => moveItem(prev, i, -1))} onMoveDown={() => setItems(prev => moveItem(prev, i, 1))} onDelete={() => setItems(prev => prev.filter((_, idx) => idx !== i))} />
            </div>
            <textarea value={it.answer} onChange={e => update(i, 'answer', e.target.value)} placeholder="Answer" className={`${TEXTAREA} w-full`} />
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 font-sans text-xs text-sage hover:text-palmetto tracking-wide uppercase border border-dashed border-sage/30 hover:border-sage/60 rounded px-4 py-2 transition-colors w-full">
        + Add FAQ
      </button>
      <SaveBar section="faqs" saving={saving} saved={saved} onSave={onSave} />
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'hotels',   label: 'Hotels' },
  { id: 'guide',    label: 'Columbia Guide' },
  { id: 'faqs',     label: 'FAQs' },
]

export default function InfoContentTab() {
  const [active, setActive] = useState('schedule')
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [hotels, setHotels] = useState(DEFAULT_HOTELS)
  const [guide, setGuide] = useState(DEFAULT_COLUMBIA_GUIDE)
  const [faqs, setFaqs] = useState(DEFAULT_FAQS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSiteContent()
      .then(data => {
        setSchedule(data.schedule)
        setHotels(data.hotels)
        setGuide(data.columbiaGuide)
        setFaqs(data.faqs)
      })
      .catch(() => setError('Failed to load content.'))
      .finally(() => setLoading(false))
  }, [])

  async function saveSection(section) {
    setSaving(section)
    setError('')
    const map = { schedule, hotels, guide, faqs }
    const firestoreKey = section === 'guide' ? 'columbiaGuide' : section
    try {
      await saveSiteSection(firestoreKey, map[section])
      setSaved(section)
      setTimeout(() => setSaved(null), 3000)
    } catch {
      setError('Save failed. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p className="font-sans text-sage py-10 text-center">Loading content…</p>

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-serif text-palmetto text-2xl text-pressed">Details Page Content</h2>
          <p className="font-sans text-sage text-xs mt-1">
            Changes are saved per-section and go live immediately.
          </p>
        </div>
        <a
          href="/information"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-xs tracking-[0.15em] uppercase border border-sage/40 text-sage px-4 py-2 rounded hover:border-sage hover:text-palmetto transition-colors shrink-0"
        >
          Preview Page ↗
        </a>
      </div>

      {error && <p className="font-sans text-red-500 text-sm mb-4">{error}</p>}

      {/* Section switcher */}
      <div className="flex gap-1 mb-6 border-b border-sage/20 pb-0">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2.5 -mb-px border-b-2 transition-colors ${
              active === s.id
                ? 'border-palmetto text-palmetto'
                : 'border-transparent text-sage hover:text-palmetto'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {active === 'schedule' && <ScheduleSection items={schedule} setItems={setSchedule} saving={saving} saved={saved} onSave={() => saveSection('schedule')} />}
      {active === 'hotels'   && <HotelsSection   items={hotels}   setItems={setHotels}   saving={saving} saved={saved} onSave={() => saveSection('hotels')} />}
      {active === 'guide'    && <GuideSection     items={guide}    setItems={setGuide}    saving={saving} saved={saved} onSave={() => saveSection('guide')} />}
      {active === 'faqs'     && <FaqsSection      items={faqs}     setItems={setFaqs}     saving={saving} saved={saved} onSave={() => saveSection('faqs')} />}
    </div>
  )
}
