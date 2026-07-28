import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// --- Fuzzy matching helpers ---

function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  let row = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const next = [i]
    for (let j = 1; j <= n; j++) {
      next[j] = a[i - 1] === b[j - 1]
        ? row[j - 1]
        : 1 + Math.min(row[j], next[j - 1], row[j - 1])
    }
    row = next
  }
  return row[n]
}

function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1
  const len1 = s1.length
  const len2 = s2.length
  if (len1 === 0 || len2 === 0) return 0
  const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0)
  const s1Matches = new Array(len1).fill(false)
  const s2Matches = new Array(len2).fill(false)
  let matches = 0
  let transpositions = 0

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist)
    const end = Math.min(i + matchDist + 1, len2)
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++
    k++
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3

  let prefix = 0
  for (let i = 0; i < Math.min(4, len1, len2); i++) {
    if (s1[i] !== s2[i]) break
    prefix++
  }

  return jaro + prefix * 0.1 * (1 - jaro)
}

/**
 * Scores a guest name against the search query.
 * Returns a value > 0 if the guest is a candidate match, 0 otherwise.
 * Higher scores indicate closer matches.
 */
function scoreGuest(nameLower, queryLower) {
  if (nameLower === queryLower) return 100

  // Full substring matches
  if (nameLower.startsWith(queryLower)) return 80
  if (nameLower.includes(queryLower)) return 70

  const nameTokens = nameLower.split(/\s+/)
  const queryTokens = queryLower.split(/\s+/)

  // All query tokens are prefixes of some name token (handles "John S" → "John Smith")
  const allTokensPrefixMatch = queryTokens.every(qt =>
    nameTokens.some(nt => nt.startsWith(qt))
  )
  if (allTokensPrefixMatch) return 60

  // Any query token is a prefix/suffix match for a name token
  const anyTokenPrefixMatch = queryTokens.some(qt =>
    nameTokens.some(nt => nt.startsWith(qt) || qt.startsWith(nt))
  )
  if (anyTokenPrefixMatch) return 50

  // Fuzzy: Jaro-Winkler on the full name (catches "Randall Smith" ↔ "Randy Smith")
  const fullSim = jaroWinkler(nameLower, queryLower)
  if (fullSim >= 0.85) return Math.round(fullSim * 40)

  // Fuzzy: Jaro-Winkler on individual tokens (catches first/last name typos)
  const bestTokenSim = Math.max(
    0,
    ...queryTokens.flatMap(qt => nameTokens.map(nt => jaroWinkler(qt, nt)))
  )
  if (bestTokenSim >= 0.75) return Math.round(bestTokenSim * 30)

  // Last resort: token-level Levenshtein for short tokens (handles single-char typos)
  const bestTokenLev = Math.max(
    0,
    ...queryTokens.flatMap(qt =>
      nameTokens.map(nt => {
        const maxLen = Math.max(qt.length, nt.length)
        if (maxLen === 0) return 0
        return (maxLen - levenshtein(qt, nt)) / maxLen
      })
    )
  )
  if (bestTokenLev >= 0.8) return Math.round(bestTokenLev * 20)

  return 0
}

// --- End fuzzy matching helpers ---

/**
 * Looks up a guest in Firestore by their name.
 *
 * Expected /guests document shape:
 *   {
 *     name: "Jane Smith",
 *     nameLower: "jane smith",
 *     groupId: "abc123",
 *     party: [{ guestId: "abc123", name: "Jane Smith" }, ...],
 *   }
 */
export async function lookupGuest(name) {
  const normalized = name.trim().toLowerCase()
  const q = query(collection(db, 'guests'), where('nameLower', '==', normalized))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// Module-level cache so the full guest list is only fetched once per page load.
let _cachedGuests = null

async function fetchAllGuests() {
  if (_cachedGuests) return _cachedGuests
  const snap = await getDocs(collection(db, 'guests'))
  _cachedGuests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return _cachedGuests
}

/**
 * Searches all guests for partial/fuzzy matches against the given query.
 * Returns up to 8 candidates ranked by match quality (best first).
 * Falls back to this when an exact lookupGuest returns null.
 */
export async function searchGuests(query) {
  const queryLower = query.trim().toLowerCase()
  if (!queryLower) return []

  const allGuests = await fetchAllGuests()
  const scored = []
  allGuests.forEach(guest => {
    const nameLower = guest.nameLower ?? guest.name?.toLowerCase() ?? ''
    const score = scoreGuest(nameLower, queryLower)
    if (score > 0) {
      scored.push({ score, guest })
    }
  })

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (a.guest.name ?? '').localeCompare(b.guest.name ?? '')
  )
  return scored.slice(0, 8).map(s => s.guest)
}

export async function getGroupRSVPs(groupId) {
  const q = query(collection(db, 'rsvps'), where('groupId', '==', groupId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Writes (or overwrites) an individual RSVP to /rsvps/{guestId}.
 */
export async function submitRSVP(guestId, data) {
  await setDoc(doc(db, 'rsvps', guestId), {
    ...data,
    submittedAt: serverTimestamp(),
  })
}
