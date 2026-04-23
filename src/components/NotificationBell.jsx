import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationLabel,
} from '../hooks/useNotifications'
import { timeAgo } from '../utils/richText'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToNotifications({
      uid: user.uid,
      onUpdate: setNotifications,
    })
    return unsub
  }, [user])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  async function handleOpen() {
    setOpen(o => !o)
  }

  async function handleNotifClick(notif) {
    setOpen(false)
    if (!notif.read) await markNotificationRead(notif.id)
    if (notif.type === 'upvote_song') {
      navigate('/lounge?tab=mixtape')
    } else {
      navigate(`/lounge?tab=social&post=${notif.postId}`)
    }
  }

  async function handleMarkAll() {
    if (user) await markAllNotificationsRead(user.uid)
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 text-sage hover:text-palmetto transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-sunrise-orange text-paper rounded-full flex items-center justify-center text-[9px] font-sans font-bold leading-none pointer-events-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-[420px] bg-paper border border-sage/20 rounded-xl shadow-xl z-[300] flex flex-col overflow-hidden paper-lift">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sage/15">
            <h3 className="font-serif text-palmetto text-base text-pressed">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="font-sans text-xs text-sage hover:text-palmetto transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="font-sans text-sage text-sm">Nothing yet — check back soon!</p>
              </div>
            )}
            {notifications.map(notif => (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleNotifClick(notif)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-sage/8 last:border-0 transition-colors hover:bg-sage/5 ${
                  !notif.read ? 'bg-palmetto/4' : ''
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  {!notif.read
                    ? <div className="w-2 h-2 rounded-full bg-sunrise-orange" />
                    : <div className="w-2 h-2 rounded-full bg-sage/20" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-palmetto text-xs leading-relaxed">
                    {getNotificationLabel(notif)}
                  </p>
                  {notif.postSnippet && (
                    <p className="font-sans text-sage text-[11px] mt-0.5 truncate">
                      "{notif.postSnippet}"
                    </p>
                  )}
                  <p className="font-sans text-sage/50 text-[10px] mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
