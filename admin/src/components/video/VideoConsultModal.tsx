import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Video, X } from 'lucide-react'
import { api } from '../../lib/api'

interface VideoConsultModalProps {
  bookingId: string
  title: string
  endpoint: string
  onClose: () => void
}

interface JaasSession {
  appId: string
  room: string
  jwt: string
  url: string
}

// 8x8 JaaS posts conference lifecycle messages to the parent window even for a
// plain iframe embed. We treat a conference being joined then left as the call
// ending (either side leaving, or the moderator ending the meeting).
const isJoinMsg = (m: { event?: string; type?: string } | null) =>
  m?.event === 'videoConferenceJoined' || m?.type === 'video-conference-joined'
const isLeftMsg = (m: { event?: string; type?: string } | null) =>
  m?.event === 'videoConferenceLeft' || m?.type === 'video-conference-left'

// Embeds the 8x8 JaaS meeting for one booking using a short-lived token from
// the server. The iframe src is exactly what the JaaS SDK builds internally,
// so no extra SDK dependency is needed.
export function VideoConsultModal({ bookingId, title, endpoint, onClose }: VideoConsultModalProps) {
  const [session, setSession] = useState<JaasSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ended, setEnded] = useState(false)
  const joinedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<{ session: JaasSession }>(`${endpoint}/${bookingId}/video-token`)
      .then((res) => {
        if (!cancelled) setSession(res.session)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [endpoint, bookingId])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const m = e.data as { event?: string; type?: string } | null
      if (isJoinMsg(m)) joinedRef.current = true
      if (isLeftMsg(m) && joinedRef.current) setEnded(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white leading-tight">{title}</p>
            <p className="text-[10px] text-slate-400 font-mono">{bookingId}</p>
          </div>
        </div>
        <button
          onClick={() => setEnded(true)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Leave Call
        </button>
      </div>

      {/* Meeting area */}
      <div className="flex-1 relative">
        {session?.url && !ended ? (
          <iframe
            src={session.url}
            title="Video consultation"
            className="absolute inset-0 w-full h-full border-0 bg-slate-950"
            allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
            allowFullScreen
          />
        ) : ended ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">The consultation has ended.</p>
              <p className="text-[11px] text-slate-400">Finalize the session, write a prescription, or schedule follow-ups.</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-xs font-extrabold transition-all hover:opacity-90"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            {error ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <X className="w-6 h-6 text-rose-400" />
                </div>
                <p className="text-sm font-bold text-rose-300">{error}</p>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                <p className="text-sm font-bold text-white">Connecting you to your consultation…</p>
                <p className="text-[11px] text-slate-400">Please allow camera &amp; microphone access.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}