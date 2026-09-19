import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Star, Video, X } from 'lucide-react';
import { api } from '../../lib/api';

interface VideoConsultModalProps {
  bookingId: string;
  title: string;
  doctorName?: string;
  onClose: () => void;
}

interface JaasSession {
  appId: string;
  room: string;
  jwt: string;
  url: string;
}

// 8x8 JaaS posts conference lifecycle messages to the parent window even for a
// plain iframe embed. We treat a conference being joined then left as the call
// ending (either side leaving, or the moderator ending the meeting).
const isJoinMsg = (m: { event?: string; type?: string } | null) =>
  m?.event === 'videoConferenceJoined' || m?.type === 'video-conference-joined';
const isLeftMsg = (m: { event?: string; type?: string } | null) =>
  m?.event === 'videoConferenceLeft' || m?.type === 'video-conference-left';

// Embeds the 8x8 JaaS meeting for one booking using a short-lived token from
// the server. When the call ends, the consultation is finalized and the patient
// gets a "Session Completed" window with a rating/review popup.
export const VideoConsultModal: React.FC<VideoConsultModalProps> = ({ bookingId, title, doctorName, onClose }) => {
  const [session, setSession] = useState<JaasSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const joinedRef = useRef(false);
  const finalizedRef = useRef(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<false | string>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ session: JaasSession }>(`/appointments/${bookingId}/video-token`)
      .then((res) => {
        if (!cancelled) setSession(res.session);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const m = e.data as { event?: string; type?: string } | null;
      if (isJoinMsg(m)) joinedRef.current = true;
      if (isLeftMsg(m) && joinedRef.current) {
        setEnded(true);
        if (!finalizedRef.current) {
          finalizedRef.current = true;
          // Default end-of-call flow: the patient leaving finalizes the booking
          // so it reflects as completed (and the review below is allowed).
          api.post(`/appointments/${bookingId}/finalize`, {}).catch(() => {});
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [bookingId]);

  const handleLeave = () => {
    if (!ended) setEnded(true);
    if (!finalizedRef.current) {
      finalizedRef.current = true;
      api.post(`/appointments/${bookingId}/finalize`, {}).catch(() => {});
    }
  };

  const submitReview = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/reviews', { appointmentId: bookingId, rating, comment: comment.trim() || undefined });
      setSubmitted('Thanks! Your feedback has been recorded.');
    } catch (err) {
      const msg = (err as Error).message || 'Could not submit your review right now.';
      const already = /already|409/i.test(msg);
      setSubmitError(already ? null : msg);
      setSubmitted(already ? 'You have already reviewed this session.' : false);
    } finally {
      setSubmitting(false);
    }
  };

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
        {!ended && (
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Leave Call
          </button>
        )}
      </div>

      {/* Meeting area */}
      <div className="flex-1 relative overflow-y-auto">
        {!ended && session?.url ? (
          <iframe
            src={session.url}
            title="Video consultation"
            className="absolute inset-0 w-full h-full border-0 bg-slate-950"
            allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
            allowFullScreen
          />
        ) : !ended ? (
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
        ) : (
          <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-900">Session Completed</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Thank you {doctorName ? `for consulting ${doctorName}` : ''}. Your session has been marked complete.
                </p>
              </div>

              {!submitted && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-center text-xs font-bold text-slate-700 uppercase tracking-wide">Rate your consultation</p>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className={`p-1 rounded-lg transition-transform hover:scale-110 ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        <Star className={`w-8 h-8 ${n <= rating ? 'fill-amber-400' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Share your experience with this doctor (optional)"
                    className="mt-4 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                  />
                  {submitError && <p className="mt-2 text-[11px] font-bold text-rose-600">{submitError}</p>}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSubmitted('session')}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={submitReview}
                      disabled={rating === 0 || submitting}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-xs font-extrabold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5 fill-white" />}
                      Submit Review
                    </button>
                  </div>
                </div>
              )}

              {submitted && (
                <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                  <p className="text-sm font-bold text-teal-700">
                    {typeof submitted === 'string' ? submitted : 'See you at your next session!'}
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-6 w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-extrabold hover:bg-teal-500 transition-colors"
              >
                {submitted ? 'Done' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};