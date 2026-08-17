import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, MessageSquare, DollarSign, Calendar, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { api } from '../lib/api'
import type { DoctorNotification } from '../lib/types'

const typeIcons: Record<string, typeof MessageSquare> = {
  community: MessageSquare,
  payment: DollarSign,
  appointment: Calendar,
  message: Mail,
}
const typeColors: Record<string, string> = {
  community: 'text-blue-600 bg-blue-50',
  payment: 'text-emerald-600 bg-emerald-50',
  appointment: 'text-amber-600 bg-amber-50',
  message: 'text-purple-600 bg-purple-50',
}

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: countData } = useQuery({
    queryKey: ['doctor-notifications/unread-count'],
    queryFn: () => api.get('/doctor/notifications/unread-count') as Promise<{ count: number }>,
    refetchInterval: isOpen ? false : 30_000,
  })

  const { data: notifData } = useQuery({
    queryKey: ['doctor-notifications'],
    queryFn: () => api.get('/doctor/notifications?limit=30') as Promise<{ notifications: DoctorNotification[] }>,
    enabled: isOpen,
  })

  const markRead = useMutation({
    mutationFn: (id: number) => api.patch(`/doctor/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notifications/unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-notifications'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/doctor/notifications/read-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-notifications/unread-count'] })
    },
  })

  // Refetch on window focus when open
  useEffect(() => {
    if (!isOpen) return
    const onFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-notifications/unread-count'] })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [isOpen, queryClient])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  const handleClick = useCallback((n: DoctorNotification) => {
    if (!n.read) markRead.mutate(n.id)
    setIsOpen(false)
    if (n.link) navigate(n.link)
  }, [markRead, navigate])

  const unread = countData?.count ?? 0
  const notifications = notifData?.notifications ?? []

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">You're all caught up!</div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] ?? Bell
                const color = typeColors[n.type] ?? 'text-slate-600 bg-slate-50'
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      !n.read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      {n.body && <p className="mt-0.5 truncate text-xs text-slate-500">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
