import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getGuestByUid, linkGuestUid } from '../hooks/useGuests'
import { getCoupleProfile, setCoupleProfile } from '../hooks/useCoupleProfiles'

const GuestIdentityContext = createContext(null)

/**
 * Tracks the current user's identity.
 *
 * For anonymous guests:
 *   - Resolves via `linkedUid` field on the Firestore guest document.
 *   - linkedGuest shape: { id, name, party, ... }
 *
 * For admins (email/password sign-in):
 *   - Resolves via `config/coupleProfiles` Firestore doc.
 *   - linkedGuest shape: { name, role: 'bride'|'groom', isCouple: true }
 *
 * State values:
 *   undefined  →  still resolving
 *   null       →  logged in but identity not yet claimed
 *   object     →  identity claimed
 */
export function GuestIdentityProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [linkedGuest, setLinkedGuest] = useState(undefined)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLinkedGuest(null)
      return
    }

    setLinkedGuest(undefined)

    if (user.isAnonymous) {
      // Regular guest flow
      getGuestByUid(user.uid)
        .then(guest => setLinkedGuest(guest ?? null))
        .catch(() => setLinkedGuest(null))
    } else {
      // Admin / couple flow
      getCoupleProfile(user.uid)
        .then(profile => setLinkedGuest(profile ? { ...profile, isCouple: true } : null))
        .catch(() => setLinkedGuest(null))
    }
  }, [user, authLoading])

  // For anonymous guests: link to a Firestore guest document
  const claimIdentity = useCallback(async (guestId) => {
    if (!user) throw new Error('Not authenticated')
    await linkGuestUid(guestId, user.uid)
    const guest = await getGuestByUid(user.uid)
    setLinkedGuest(guest ?? null)
  }, [user])

  // For admins: save name + role to config/coupleProfiles
  const claimCoupleIdentity = useCallback(async ({ name, role }) => {
    if (!user) throw new Error('Not authenticated')
    await setCoupleProfile(user.uid, { name, role })
    setLinkedGuest({ name, role, isCouple: true })
  }, [user])

  return (
    <GuestIdentityContext.Provider value={{
      linkedGuest,
      identityLoading: linkedGuest === undefined,
      claimIdentity,
      claimCoupleIdentity,
    }}>
      {children}
    </GuestIdentityContext.Provider>
  )
}

export function useGuestIdentity() {
  return useContext(GuestIdentityContext)
}
