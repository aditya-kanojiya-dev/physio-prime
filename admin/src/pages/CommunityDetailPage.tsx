import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Send,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { AdminLayout } from '../components/admin/AdminLayout'
import type { CommunityPost, CommunityReply } from '../lib/types'

const tagColors = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [replyBody, setReplyBody] = useState('')

  const { data: post, isLoading } = useQuery({
    queryKey: ['community/posts', id],
    queryFn: () => api.get<{ post: CommunityPost & { replies: CommunityReply[] } }>(`/community/posts/${id}`),
    select: (d) => d.post,
  })

  const voteMutation = useMutation({
    mutationFn: ({ direction }: { direction: 'up' | 'down' }) =>
      api.post(`/community/posts/${id}/vote`, { direction }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community/posts', id] }),
  })

  const replyMutation = useMutation({
    mutationFn: () => api.post(`/community/posts/${id}/replies`, { body: replyBody }),
    onSuccess: () => {
      setReplyBody('')
      queryClient.invalidateQueries({ queryKey: ['community/posts', id] })
    },
  })

  const replyVoteMutation = useMutation({
    mutationFn: ({ replyId, direction }: { replyId: number; direction: 'up' | 'down' }) =>
      api.post(`/community/replies/${replyId}/vote`, { direction }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community/posts', id] }),
  })

  if (isLoading) {
    return (
      <AdminLayout portal="doctor">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (!post) {
    return (
      <AdminLayout portal="doctor">
        <div className="text-center py-24 text-slate-400 text-sm">Post not found.</div>
      </AdminLayout>
    )
  }

  const replies = post.replies ?? []
  const acceptedReply = replies.find((r) => r.accepted)
  const otherReplies = replies.filter((r) => !r.accepted).sort((a, b) => b.voteCount - a.voteCount)
  const sortedReplies = acceptedReply ? [acceptedReply, ...otherReplies] : otherReplies

  return (
    <AdminLayout portal="doctor">
      <div
        className="min-h-screen rounded-3xl space-y-6"
        style={{ background: 'linear-gradient(180deg, #F4FBF9 0%, #F0FDFA 60%, #E9F6F2 100%)' }}
      >
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </button>

        {/* Post */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
          <div className="flex gap-4">
            {/* Vote column */}
            <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => voteMutation.mutate({ direction: 'up' })}
                className="p-1 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <ChevronUp className="w-6 h-6 text-slate-400 hover:text-teal-600" />
              </button>
              <span className="text-lg font-black text-slate-700">{post.voteCount}</span>
              <button
                onClick={() => voteMutation.mutate({ direction: 'down' })}
                className="p-1 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <ChevronDown className="w-6 h-6 text-slate-400 hover:text-rose-600" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white font-black flex items-center justify-center shrink-0">
                  {post.doctor.photo ? (
                    <img src={post.doctor.photo} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    post.doctor.name.slice(0, 1)
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{post.doctor.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {post.doctor.specialty} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {/* Title + body */}
              <h1 className="text-xl font-black text-slate-900 mb-3">{post.title}</h1>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{post.body}</div>
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag, i) => (
                    <span key={tag} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tagColors[i % tagColors.length]}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Mobile vote + stats */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold sm:hidden">
                <button onClick={() => voteMutation.mutate({ direction: 'up' })} className="flex items-center gap-1">
                  <ChevronUp className="w-4 h-4" /> {post.voteCount}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900">
            {sortedReplies.length} {sortedReplies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          {sortedReplies.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
              No replies yet. Be the first to respond.
            </div>
          ) : (
            sortedReplies.map((reply) => (
              <div
                key={reply.id}
                className={`p-5 rounded-3xl bg-white border shadow-xl ${
                  reply.accepted ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                }`}
              >
                {reply.accepted && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-extrabold mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Accepted Answer
                  </div>
                )}
                <div className="flex gap-4">
                  {/* Vote column */}
                  <div className="hidden sm:flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => replyVoteMutation.mutate({ replyId: reply.id, direction: 'up' })}
                      className="p-0.5 rounded hover:bg-teal-50"
                    >
                      <ChevronUp className="w-5 h-5 text-slate-300 hover:text-teal-600" />
                    </button>
                    <span className="text-sm font-black text-slate-700">{reply.voteCount}</span>
                    <button
                      onClick={() => replyVoteMutation.mutate({ replyId: reply.id, direction: 'down' })}
                      className="p-0.5 rounded hover:bg-rose-50"
                    >
                      <ChevronDown className="w-5 h-5 text-slate-300 hover:text-rose-600" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {reply.doctor.photo ? (
                          <img src={reply.doctor.photo} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          reply.doctor.name.slice(0, 1)
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{reply.doctor.name}</span>
                      {reply.doctor.specialty && (
                        <span className="text-[10px] text-slate-400">· {reply.doctor.specialty}</span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reply.body}</div>
                    {/* Mobile vote */}
                    <div className="flex items-center gap-2 mt-3 sm:hidden">
                      <button
                        onClick={() => replyVoteMutation.mutate({ replyId: reply.id, direction: 'up' })}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-400"
                      >
                        <ChevronUp className="w-4 h-4" /> {reply.voteCount}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply editor */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl">
          <h3 className="text-xs font-extrabold text-slate-900 mb-3">Your Reply</h3>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Share your expertise..."
            rows={4}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500 resize-none mb-3"
          />
          {replyMutation.isError && (
            <p className="text-xs text-rose-600 font-bold mb-2">{replyMutation.error.message}</p>
          )}
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!replyBody.trim() || replyMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-xs font-extrabold shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {replyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post Reply
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
