import { useState } from 'react'
import { saveGuestGroup } from '../../../hooks/useGuests'

function parseDelimitedNames(value) {
  return String(value ?? '')
    .split(/[\n|,]/)
    .map(name => name.trim())
    .filter(Boolean)
}

function groupSignature(names) {
  return [...names].map(name => name.toLowerCase()).sort().join('|')
}

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
        i++
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
      i++
    }
    if (row.some(f => f.trim())) rows.push(row)
  }

  return rows
}

function generateTsv(groups) {
  const header = ['Primary Name', 'Party Members', 'Address', 'Phone', 'RSVP status', 'Notes']
  const dataRows = groups.map(group => [
    group.party[0]?.name ?? '',
    group.party.map(member => member.name).join(' | '),
    group.address ?? '',
    group.phone ?? '',
    group.rsvpStatus ?? '',
    group.notes ?? '',
  ])

  return [header, ...dataRows]
    .map(row =>
      row.map(cell => {
        const value = String(cell)
        if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join('\t')
    )
    .join('\n')
}

export default function GuestImportExport({ groups, onImportComplete, onClose }) {
  const [mode, setMode] = useState('import')
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  function handleParse() {
    if (!rawText.trim()) return
    const rows = parseTsv(rawText.trim())
    if (rows.length < 2) return

    const [headerRow, ...dataRows] = rows
    const cols = headerRow.map(header => header.trim().toLowerCase())

    const idx = {
      primaryName: cols.findIndex(col => col === 'primary name' || col === 'name'),
      partyMembers: cols.findIndex(col => col === 'party members' || col === 'group members'),
      address: cols.findIndex(col => col === 'address'),
      phone: cols.findIndex(col => col === 'phone'),
      rsvp: cols.findIndex(col => col.includes('rsvp')),
      notes: cols.findIndex(col => col === 'notes'),
    }

    if (idx.primaryName === -1) idx.primaryName = 0
    if (idx.partyMembers === -1) idx.partyMembers = 1
    if (idx.address === -1) idx.address = 2
    if (idx.phone === -1) idx.phone = 3
    if (idx.rsvp === -1) idx.rsvp = 4
    if (idx.notes === -1) idx.notes = 5

    const existingGroups = new Map(
      groups.map(group => [groupSignature(group.party.map(member => member.name)), group])
    )

    const parsed = dataRows
      .map(row => {
        const primaryName = row[idx.primaryName]?.trim() ?? ''
        const listedMembers = parseDelimitedNames(row[idx.partyMembers])
        const members = listedMembers.length > 0 ? listedMembers : (primaryName ? [primaryName] : [])
        const signature = groupSignature(members)
        const existingGroup = existingGroups.get(signature) ?? null

        return {
          party: members.map(name => ({ name, guestId: null })),
          previewKey: signature || row.join('|').toLowerCase(),
          address: row[idx.address]?.trim() ?? '',
          phone: row[idx.phone]?.trim() ?? '',
          rsvpStatus: row[idx.rsvp]?.trim() ?? '',
          notes: row[idx.notes]?.trim() ?? '',
          status: existingGroup ? 'duplicate' : 'new',
          existingGroup,
          include: members.length > 0,
        }
      })
      .filter(row => row.party.length > 0)

    setPreview(parsed)
    setResult(null)
  }

  function toggleInclude(index) {
    setPreview(prev => prev.map((row, i) => i === index ? { ...row, include: !row.include } : row))
  }

  async function handleImport() {
    const toProcess = preview.filter(row => row.include)
    if (!toProcess.length) return

    setImporting(true)
    let added = 0
    let updated = 0
    let errors = 0

    for (const row of toProcess) {
      try {
        const existingIdsByName = new Map(
          (row.existingGroup?.members ?? []).map(member => [member.name.toLowerCase(), member.id])
        )
        const party = row.party.map(member => ({
          name: member.name,
          guestId: existingIdsByName.get(member.name.toLowerCase()) ?? null,
        }))

        await saveGuestGroup(row.existingGroup, {
          party,
          address: row.address,
          phone: row.phone,
          rsvpStatus: row.rsvpStatus,
          notes: row.notes,
        })

        if (row.status === 'duplicate') updated++
        else added++
      } catch {
        errors++
      }
    }

    setImporting(false)
    setResult({ added, updated, errors })
    onImportComplete()
  }

  const exportText = generateTsv(groups)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no-op
    }
  }

  const newCount = preview?.filter(row => row.status === 'new').length ?? 0
  const duplicateCount = preview?.filter(row => row.status === 'duplicate').length ?? 0
  const selectedCount = preview?.filter(row => row.include).length ?? 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto mt-16">
      <div className="flex min-h-full items-start justify-center p-4">
        <div className="bg-paper rounded-lg w-full max-w-2xl my-16 sm:my-8 shadow-2xl">
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

          <div className="flex gap-1 px-4 sm:px-6 pt-3 sm:pt-4">
            {['import', 'export'].map(tab => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-1.5 rounded-full transition-all ${
                  mode === tab ? 'bg-palmetto text-paper' : 'text-sage hover:text-palmetto'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-5">
            {mode === 'import' && (
              <div className="flex flex-col gap-4">
                {!result ? (
                  <>
                    <p className="font-sans text-sage text-xs leading-relaxed break-words">
                      Paste your sheet with columns like{' '}
                      <span className="text-palmetto break-words">Primary Name · Party Members · Address · Phone · RSVP status · Notes</span>.
                      Separate party members with a pipe, comma, or line break.
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
                            <span className="text-sunrise-orange font-semibold">{duplicateCount}</span> already exist
                          </p>
                          <p className="font-sans text-xs text-sage ml-auto">
                            {selectedCount} selected for import
                          </p>
                        </div>

                        <div className="border border-sage/20 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-[24px_1fr_80px] bg-sage/10 px-2 sm:px-3 py-2 gap-2 sm:gap-3">
                            <span />
                            <span className="font-sans text-[10px] uppercase tracking-widest text-sage">Group</span>
                            <span className="font-sans text-[10px] uppercase tracking-widest text-sage">Status</span>
                          </div>
                          <div className="divide-y divide-sage/10 max-h-64 overflow-y-auto">
                            {preview.map((row, index) => (
                              <label
                                key={row.previewKey || `preview-${index}`}
                                className="grid grid-cols-[24px_1fr_80px] px-2 sm:px-3 py-2.5 gap-2 sm:gap-3 items-center cursor-pointer hover:bg-sage/5 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={row.include}
                                  onChange={() => toggleInclude(index)}
                                  className="accent-palmetto"
                                />
                                <span className="font-sans text-sm text-palmetto truncate">
                                  {row.party.map(member => member.name).join(' · ')}
                                </span>
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
                            Existing groups will be updated when checked.
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

            {mode === 'export' && (
              <div className="flex flex-col gap-4">
                <p className="font-sans text-sage text-xs leading-relaxed break-words">
                  Copy this and paste it into Google Sheets. Each row represents one household group, with all guest names kept together.
                </p>
                <textarea
                  readOnly
                  value={exportText}
                  rows={12}
                  className="w-full border border-sage/40 rounded px-3 py-2 font-mono text-xs text-palmetto/70 bg-sage/5 focus:outline-none resize-y"
                  onFocus={e => e.target.select()}
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-sans text-xs text-sage/50">{groups.length} groups</p>
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
