import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

function normalizeName(value) {
  return String(value ?? '').trim()
}

function generateGuestId() {
  return doc(collection(db, 'guests')).id
}

function getLegacyMemberId(groupId, index) {
  return `legacy-${groupId}-${index}`
}

function normalizeParty(party, fallbackName = '') {
  const source = Array.isArray(party) && party.length > 0
    ? party
    : [{ guestId: null, name: fallbackName }]

  return source
    .map((member, index) => {
      const name = normalizeName(typeof member === 'string' ? member : member?.name)
      if (!name) return null

      return {
        guestId: typeof member === 'string' ? null : member?.guestId ?? member?.id ?? null,
        name,
        sortOrder: typeof member === 'object' && member?.sortOrder != null ? member.sortOrder : index,
      }
    })
    .filter(Boolean)
}

function buildGuestRecord(member, party, groupId, shared, existing = {}) {
  return {
    name: member.name,
    nameLower: member.name.toLowerCase(),
    groupId,
    party,
    address: shared.address,
    phone: shared.phone,
    rsvpStatus: shared.rsvpStatus,
    notes: shared.notes,
    linkedUid: existing.linkedUid ?? null,
    createdAt: existing.createdAt ?? serverTimestamp(),
  }
}

export function isLegacyGuestRecord(guest) {
  if (!guest?.groupId) return true
  const party = normalizeParty(guest.party, guest.name)
  return party.some(member => !member.guestId)
}

export function groupGuestsByHousehold(guests) {
  const grouped = new Map()

  guests.forEach(guest => {
    const key = guest.groupId ?? guest.id
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(guest)
  })

  return [...grouped.entries()]
    .map(([id, members]) => {
      const lead = members.find(member => member.id === id) ?? members[0]
      const party = normalizeParty(lead?.party, lead?.name)
      const membersById = new Map(members.map(member => [member.id, member]))
      const orderedMembers = party
        .map((member, index) => ({
          ...(membersById.get(member.guestId) ?? {
            id: member.guestId ?? getLegacyMemberId(id, index),
            linkedUid: null,
          }),
          name: member.name,
        }))
        .sort((a, b) => {
          const aIndex = party.findIndex(member => member.guestId === a.id || member.name === a.name)
          const bIndex = party.findIndex(member => member.guestId === b.id || member.name === b.name)
          return aIndex - bIndex
        })

      return {
        id,
        name: lead?.name ?? orderedMembers[0]?.name ?? 'Untitled group',
        party: orderedMembers.map(member => ({ guestId: member.id, name: member.name })),
        members: orderedMembers,
        address: lead?.address ?? '',
        phone: lead?.phone ?? '',
        rsvpStatus: lead?.rsvpStatus ?? '',
        notes: lead?.notes ?? '',
        isLegacy: members.some(isLegacyGuestRecord),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getAllGuests() {
  const snap = await getDocs(collection(db, 'guests'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveGuestGroup(initialGroup, data) {
  const names = (data.party ?? [])
    .map(member => ({
      guestId: member.guestId ?? null,
      name: normalizeName(member.name),
    }))
    .filter(member => member.name)

  if (names.length === 0) {
    throw new Error('At least one guest is required.')
  }

  const existingMembers = new Map((initialGroup?.members ?? []).map(member => [member.id, member]))
  const preparedMembers = names.map(member => ({
    guestId: member.guestId ?? generateGuestId(),
    name: member.name,
  }))
  const groupId = initialGroup?.id ?? preparedMembers[0].guestId
  const party = preparedMembers.map((member, index) => ({
    guestId: member.guestId,
    name: member.name,
    sortOrder: index,
  }))
  const shared = {
    address: normalizeName(data.address),
    phone: normalizeName(data.phone),
    rsvpStatus: normalizeName(data.rsvpStatus),
    notes: normalizeName(data.notes),
  }

  const batch = writeBatch(db)

  preparedMembers.forEach(member => {
    const existing = existingMembers.get(member.guestId) ?? {}
    batch.set(
      doc(db, 'guests', member.guestId),
      buildGuestRecord(member, party, groupId, shared, existing),
      { merge: true },
    )
  })

  const retainedIds = new Set(preparedMembers.map(member => member.guestId))
  ;(initialGroup?.members ?? [])
    .filter(member => !retainedIds.has(member.id))
    .forEach(member => {
      batch.delete(doc(db, 'guests', member.id))
      batch.delete(doc(db, 'rsvps', member.id))
    })

  await batch.commit()
}

export async function deleteGuestGroup(group) {
  const batch = writeBatch(db)
  group.members.forEach(member => {
    batch.delete(doc(db, 'guests', member.id))
    batch.delete(doc(db, 'rsvps', member.id))
  })
  await batch.commit()
}

export async function migrateLegacyGuests() {
  const guests = await getAllGuests()
  const legacyGuests = guests.filter(isLegacyGuestRecord)

  for (const guest of legacyGuests) {
    const party = normalizeParty(guest.party, guest.name).map((member, index) => ({
      guestId: member.guestId ?? (index === 0 ? guest.id : generateGuestId()),
      name: member.name,
      sortOrder: index,
    }))
    const shared = {
      address: normalizeName(guest.address),
      phone: normalizeName(guest.phone),
      rsvpStatus: normalizeName(guest.rsvpStatus),
      notes: normalizeName(guest.notes),
    }
    const groupId = guest.groupId ?? guest.id
    const batch = writeBatch(db)

    party.forEach(member => {
      const existing = member.guestId === guest.id ? guest : {}
      batch.set(
        doc(db, 'guests', member.guestId),
        buildGuestRecord(member, party, groupId, shared, existing),
        { merge: true },
      )
    })

    await batch.commit()
  }

  return legacyGuests.length
}

/**
 * Links an anonymous UID to a guest document.
 * Also used for re-linking (multi-device): the Firestore rule allows
 * overwriting `linkedUid` when the new value is the caller's own UID.
 */
export async function linkGuestUid(guestId, uid) {
  await updateDoc(doc(db, 'guests', guestId), { linkedUid: uid })
}

/**
 * Removes the linkedUid from a guest document (admin only).
 * Allows a guest to re-claim their identity from scratch on any device.
 */
export async function resetGuestUid(guestId) {
  await updateDoc(doc(db, 'guests', guestId), { linkedUid: null })
}

/**
 * Returns the guest document linked to a given Firebase Auth UID, or null.
 */
export async function getGuestByUid(uid) {
  const snap = await getDocs(query(collection(db, 'guests'), where('linkedUid', '==', uid)))
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}
