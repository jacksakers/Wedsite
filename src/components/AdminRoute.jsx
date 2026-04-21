import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAdminUids } from '../hooks/useAdmins'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  // null = still checking, true/false = resolved
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user) { setIsAdmin(false); return }
    getAdminUids()
      .then(uids => setIsAdmin(uids.includes(user.uid)))
      .catch(() => setIsAdmin(false))
  }, [user, loading])

  if (loading || isAdmin === null) return null
  if (!isAdmin) return <Navigate to="/admin/login" replace />
  return children
}
