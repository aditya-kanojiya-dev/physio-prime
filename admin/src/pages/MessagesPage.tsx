import { useState, useRef, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Search,
  Send,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { Conversation, Message } from '../lib/types'
import { AdminLayout } from '../components/admin/AdminLayout'

function formatMsgTime(iso: string) {
  const d = parseISO(iso)
  return format(d, 'h:mm a')
}

function formatDayHeader(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d, yyyy')
}

export function MessagesPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [newMsgOpen, setNewMsgOpen] = useState(false)
  const [newMsgSearch, setNewMsgSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: profileData } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => api.get<{ doctor: { id: number } }>('/doctor/profile'),
  })
  const myDoctorId = profileData?.doctor?.id

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<{ conversations: Conversation[] }>('/doctor/messages/conversations'),
    refetchInterval: 10000,
  })

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => api.get<{ messages: Message[] }>(`/doctor/messages/conversations/${selectedId}?limit=50`),
    enabled: !!selectedId,
  })

  const sendMutation = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: number; message: string }) =>
      api.post(`/doctor/messages/conversations/${conversationId}/replies`, { message }),
    onSuccess: () => {
      setInput('')
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const startMutation = useMutation({
    mutationFn: ({ toDoctorId, message }: { toDoctorId: number; message: string }) =>
      api.post('/doctor/messages/conversations', { toDoctorId, message }),
    onSuccess: () => {
      setNewMsgOpen(false)
      setNewMsgSearch('')
      setInput('')
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const conversations = convData?.conversations ?? []
  const messages = msgData?.messages ?? []

  const selectedConv = conversations.find(c => c.id === selectedId)

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(
      c => c.otherDoctor.name.toLowerCase().includes(q) ||
        (c.otherDoctor.specialty ?? '').toLowerCase().includes(q) ||
        (c.lastMessage ?? '').toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim() || !selectedId) return
    sendMutation.mutate({ conversationId: selectedId, message: input.trim() })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let current: { date: string; messages: Message[] } | null = null
    for (const msg of messages) {
      const msgDate = formatDayHeader(msg.createdAt)
      if (!current || current.date !== msgDate) {
        current = { date: msgDate, messages: [] }
        groups.push(current)
      }
      current.messages.push(msg)
    }
    return groups
  }, [messages])

  return (
    <AdminLayout portal="doctor">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
        <div className="flex flex-1 rounded-3xl border border-slate-200 bg-white overflow-hidden">
          {/* Left Panel — Conversations */}
          <div className={`${selectedId !== null ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[35%] md:min-w-[280px] border-r border-slate-200`}>
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-slate-900">Messages</h2>
                <button
                  onClick={() => setNewMsgOpen(true)}
                  className="p-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-500 hover:to-blue-500 transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convLoading ? (
                <div className="p-10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-10 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-400">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs text-slate-400 mt-1">Start a new conversation to begin messaging.</p>
                  )}
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-all hover:bg-slate-50 ${
                      selectedId === conv.id ? 'bg-slate-50 border-l-2 border-l-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-sm font-extrabold text-white">
                          {conv.otherDoctor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-slate-900 truncate">
                            {conv.otherDoctor.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {isToday(parseISO(conv.lastMessageAt))
                              ? format(parseISO(conv.lastMessageAt), 'h:mm a')
                              : isYesterday(parseISO(conv.lastMessageAt))
                                ? 'Yesterday'
                                : format(parseISO(conv.lastMessageAt), 'MMM d')}
                          </span>
                        </div>
                        {conv.otherDoctor.specialty && (
                          <p className="text-[10px] text-teal-600 font-bold truncate">{conv.otherDoctor.specialty}</p>
                        )}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-teal-600 px-1.5 text-[10px] font-extrabold text-white shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel — Chat */}
          <div className={`${selectedId === null ? 'hidden md:flex' : 'flex'} flex-col flex-1`}>
            {selectedId && selectedConv ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-sm font-extrabold text-white">
                      {selectedConv.otherDoctor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{selectedConv.otherDoctor.name}</p>
                    {selectedConv.otherDoctor.specialty && (
                      <p className="text-[10px] text-teal-600 font-bold">{selectedConv.otherDoctor.specialty}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    </div>
                  ) : (
                    groupedMessages.map(group => (
                      <div key={group.date}>
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{group.date}</span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                        {group.messages.map(msg => {
                          const isOwn = myDoctorId != null && msg.senderId === myDoctorId
                          return (
                            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                              <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-br-md'
                                  : 'bg-slate-100 text-slate-900 rounded-bl-md'
                              }`}>
                                <p className="text-sm font-bold whitespace-pre-wrap break-words">{msg.body}</p>
                                <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>
                                  {formatMsgTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-slate-200">
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={1}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message…"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors resize-none max-h-24"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sendMutation.isPending}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:from-teal-500 hover:to-blue-500 transition-all disabled:opacity-50 shrink-0"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-400">Select a conversation</p>
                  <p className="text-xs text-slate-400">Choose from existing conversations or start a new one.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {newMsgOpen && (
        <NewConversationModal
          searchQuery={newMsgSearch}
          setSearchQuery={setNewMsgSearch}
          onClose={() => { setNewMsgOpen(false); setNewMsgSearch('') }}
          onStart={(doctorId, msg) => startMutation.mutate({ toDoctorId: doctorId, message: msg })}
          isPending={startMutation.isPending}
        />
      )}
    </AdminLayout>
  )
}

function NewConversationModal({
  searchQuery,
  setSearchQuery,
  onClose,
  onStart,
  isPending,
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  onClose: () => void
  onStart: (doctorId: number, message: string) => void
  isPending: boolean
}) {
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: number; name: string; specialty: string | null } | null>(null)
  const [message, setMessage] = useState('')

  const { data: results, isLoading } = useQuery({
    queryKey: ['doctor-search', searchQuery],
    queryFn: () => api.get<{ doctors: { id: number; name: string; specialty: string | null }[] }>(`/doctor/messages/search-doctors?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
  })

  const doctors = results?.doctors ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">New Conversation</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!selectedDoctor ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors by name…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : doctors.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  {searchQuery.length >= 2 ? 'No doctors found' : 'Type at least 2 characters to search'}
                </p>
              ) : (
                doctors.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctor({ id: doc.id, name: doc.name, specialty: doc.specialty })}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-extrabold text-white">{doc.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{doc.name}</p>
                      {doc.specialty && <p className="text-[10px] text-teal-600 font-bold">{doc.specialty}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-extrabold text-white">{selectedDoctor.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">{selectedDoctor.name}</p>
                {selectedDoctor.specialty && <p className="text-[10px] text-teal-600 font-bold">{selectedDoctor.specialty}</p>}
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="ml-auto p-1 rounded-lg text-slate-400 hover:bg-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your first message…"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 transition-colors resize-none mb-3"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (message.trim()) onStart(selectedDoctor.id, message.trim())
                }}
                disabled={!message.trim() || isPending}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-xs shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50"
              >
                {isPending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
