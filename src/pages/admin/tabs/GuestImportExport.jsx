import { useState } from 'react'
import { addGuest, updateGuest } from '../../../hooks/useGuests'

/**
 * Parses TSV text (as copied from Google Sheets).
 * Handles quoted fields with embedded newlines, tabs, and double-quote escapes.
 */
function parseTsv(text) {
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows = []
  let i = 0

  while (i < s.length) {
    const row = []
    while (i < s.length) {
      let field = ''
      if (s[i] === '"') {
        i++ // skip opening quote
        while (i < s.length) {
          if (s[i] === '"') {
            if (s[i + 1] === '"') { field += '"'; i += 2 }
            else { i++; break }
          } else {
            field += s[i++]
          }
        }
      } else {
        while (i < s.length && s[i] !== '\t' && s[i] !== '\n') {
          field += s[i++]
        }
      }
      row.push(field)
      if (i >= s.length || s[i] === '\n') { i++; break }
      i++ // skip tab
    }
    if (row.some(f => f.trim())) rows.push(row)
  }

  return rows
}

function generateTsv(guests) {
  const header = ['Name', 'Address', 'Phone', 'RSVP status', 'Notes']
  const dataRows = guests.map(g => [
    g.name ?? '',
    g.address ?? '',
    g.phone ?? '',
    g.rsvpStatus ?? '',
    g.notes ?? '',
  ])
  return [header, ...dataRows]
    .map(row =>
      row.map(cell => {
        const v = String(cell)
        if (v.includes('\t') || v.includes('\n') || v.includes('"')) {
          return `"${v.replace(/"/g, '""')}"`
        }
        return v
      }).join('\t')
    )
    .join('\n')
}

export default function GuestImportExport({ guests, onImportComplete, onClose }) {
  const [mode, setMode] = useState('import')
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  // ── Parse ──────────────────────────────────────────────────────────────────
  function handleParse() {
    if (!rawText.trim()) return
    const rows = parseTsv(rawText.trim())
    if (rows.length < 2) return

    const [headerRow, ...dataRows] = rows
    const cols = headerRow.map(h => h.trim().toLowerCase())

    const idx = {
      name:    cols.findIndex(c => c === 'name'),
      address: cols.findIndex(c => c === 'address'),
      phone:   cols.findIndex(c => c === 'phone'),
      rsvp:    cols.findIndex(c => c.includes('rsvp')),
      notes:   cols.findIndex(c => c === 'notes'),
    }
    // Fall back to positional order if headers not matched
    if (idx.name    === -1) idx.name    = 0
    if (idx.address === -1) idx.address = 1
    if (idx.phone   === -1) idx.phone   = 2
    if (idx.rsvp    === -1) idx.rsvp    = 3
    if (idx.notes   === -1) idx.notes   = 4

    const parsed = dataRows
      .map(row => ({
        name:       row[idx.name]?.trim()    ?? '',
        address:    row[idx.address]?.trim() ?? '',
        phone:      row[idx.phone]?.trim()   ?? '',
        rsvpStatus: row[idx.rsvp]?.trim()    ?? '',
        notes:      row[idx.notes]?.trim()   ?? '',
      }))
      .filter(r => r.name)
      .map(r => {
        const nameLower = r.name.toLowerCase()
        const existing  = guests.find(
          g => (g.nameLower ?? g.name.trim().toLowerCase()) === nameLower
        )
        return {
          ...r,
          status:        existing ? 'duplicate' : 'new',
          existingId:    existing?.id    ?? null,
          existingParty: existing?.party ?? null,
          include:       !existing,
        }
      })

    setPreview(parsed)
    setResult(null)
  }

  function toggleInclude(idx) {
    setPreview(prev => prev.map((r, i) => i === idx ? { ...r, include: !r.include } : r))
  }

  // ── Import ─────────────────────────────────────────────────────────────────
  async function handleImport() {
    const toProcess = preview.filter(r => r.include)
    if (!toProcess.length) return

    setImporting(true)
    let added = 0, updated = 0, errors = 0

    for (const row of toProcess) {
      try {
        const data = {
          name:       row.name,
          party:      [{ name: row.name }],
          address:    row.address,
          phone:      row.phone,
          rsvpStatus: row.rsvpStatus,
          notes:      row.notes,
        }
        if (row.status === 'duplicate' && row.existingId) {
          await updateGuest(row.existingId, {
            ...data,
            party: row.existingParty ?? data.party,
          })
          updated++
        } else {
          await addGuest(data)
          added++
        }
      } catch {
        errors++
      }
    }

    setImporting(false)
    setResult({ added, updated, errors })
    onImportComplete()
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportText = generateTsv(guests)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the textarea
    }
  }

  const newCount      = preview?.filter(r => r.status === 'new').length         ?? 0
  const dupCount      = preview?.filter(r => r.status === 'duplicate').length   ?? 0
  const selectedCount = preview?.filter(r => r.include).length                  ?? 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4">
      <div className="bg-paper rounded-lg w-full max-w-2xl my-16 sm:my-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-sage/10">
          <h3 className="font-serif text-palmetto text-lg sm:text-xl">Import / Export</h3>
          <button
            onClick={onClose}
            className="font-sans text-sage hover:text-palmetto text-2xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 px-4 sm:px-6 pt-3 sm:pt-4">
          {['import', 'export'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-1.5 rounded-full transition-all ${
                mode === m ? 'bg-palmetto text-paper' : 'text-sage hover:text-palmetto'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5">

          {/* ── IMPORT ─────────────────────────────────────────────────────── */}
          {mode === 'import' && (
            <div className="flex flex-col gap-4">
              {!result ? (
                <>
                  <p className="font-sans text-sage text-xs leading-relaxed break-words">
                    In Google Sheets, select all cells (including the header row) and copy.
                    Paste below. Expected columns:{' '}
                    <span className="text-palmetto break-words">Name · Address · Phone · RSVP status · Notes</span>
                  </p>

                  <textarea
                    value={rawText}
                    onChange={e => { setRawText(e.target.value); setPreview(null) }}
                    placeholder="Paste spreadsheet data here…"
                    rows={6}
                    className="w-full border border-sage/40 rounded px-3 py-2 font-sans text-sm text-palmetto bg-paper focus:outline-none focus:ring-2 focus:ring-sage/50 resize-y"
                  />

                  <div className="flex justify-end">
                    <button
                      onClick={handleParse}
                      disabled={!rawText.trim()}
                      className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 disabled:opacity-40 transition-colors"
                    >
                      Preview
                    </button>
                  </div>

                  {preview && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <p className="font-sans text-xs text-sage">
                          <span className="text-palmetto font-semibold">{newCount}</span> new ·{' '}
                          <span className="text-sunrise-orange font-semibold">{dupCount}</span> already exist
                        </p>
                        <p className="font-sans text-xs text-sage ml-auto">
                          {selectedCount} selected for import
                        </p>
                      </div>

                      <div className="border border-sage/20 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[24px_1fr_60px] sm:grid-cols-[24px_1fr_80px_60px] bg-sage/10 px-2 sm:px-3 py-2 gap-2 sm:gap-3">
                          <span />
                          <span className="font-sans text-[10px] uppercase tracking-widest text-sage">Name</span>
                          <span className="font-sans text-[10px] uppercase tracking-widest text-sage hidden sm:block">RSVP</span>
                          <span className="font-sans text-[10px] uppercase tracking-widest text-sage">Status</span>
                        </div>
                        <div className="divide-y divide-sage/10 max-h-64 overflow-y-auto">
                          {preview.map((row, i) => (
                            <label
                              key={i}
                              className="grid grid-cols-[24px_1fr_60px] sm:grid-cols-[24px_1fr_80px_60px] px-2 sm:px-3 py-2.5 gap-2 sm:gap-3 items-center cursor-pointer hover:bg-sage/5 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={row.include}
                                onChange={() => toggleInclude(i)}
                                className="accent-palmetto"
                              />
                              <span className="font-sans text-sm text-palmetto truncate">{row.name}</span>
                              <span className="font-sans text-xs text-sage hidden sm:block truncate">{row.rsvpStatus || '—'}</span>
                              <span className={`font-sans text-[10px] uppercase tracking-widest ${
                                row.status === 'new' ? 'text-palmetto' : 'text-sunrise-orange'
                              }`}>
                                {row.status === 'new' ? 'New' : 'Exists'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2 sm:gap-3 flex-wrap">
                        <p className="font-sans text-xs text-sage/60 hidden sm:block">
                          Guests marked "Exists" will update their details if checked.
                        </p>
                        <button
                          onClick={handleImport}
                          disabled={importing || selectedCount === 0}
                          className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 disabled:opacity-40 transition-colors"
                        >
                          {importing ? 'Importing…' : `Import ${selectedCount}`}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="font-serif text-palmetto text-3xl mb-2">Done</p>
                  <p className="font-sans text-sage text-sm">
                    {result.added} added · {result.updated} updated
                    {result.errors > 0 && ` · ${result.errors} errors`}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-6 rounded hover:bg-palmetto/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── EXPORT ─────────────────────────────────────────────────────── */}
          {mode === 'export' && (
            <div className="flex flex-col gap-4">
              <p className="font-sans text-sage text-xs leading-relaxed break-words">
                Copy this and paste it into your Google Sheets.
                In Sheets use <span className="text-palmetto">Edit → Paste special → Paste values only</span> to
                avoid overwriting formatting.
              </p>
              <textarea
                readOnly
                value={exportText}
                rows={12}
                className="w-full border border-sage/40 rounded px-3 py-2 font-mono text-xs text-palmetto/70 bg-sage/5 focus:outline-none resize-y"
                onFocus={e => e.target.select()}
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-sans text-xs text-sage/50">{guests.length} records</p>
                <button
                  onClick={handleCopy}
                  className="bg-palmetto text-paper font-sans text-xs tracking-[0.2em] uppercase py-2 px-5 rounded hover:bg-palmetto/80 transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  )
}
