import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Eye,
  Search,
  Flame,
  Plus,
  X,
  Loader2,
  Users,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { AdminLayout } from '../components/admin/AdminLayout'
import type { CommunityCategory, CommunityPost } from '../lib/types'

type Sort = 'new' | 'top' | 'unanswered'

const sortTabs: { value: Sort; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
  { value: 'unanswered', label: 'Unanswered' },
]

const tagColors = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

export function CommunityPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('new')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showNewPost, setShowNewPost] = useState(false)

  const { data: catResp, isLoading: catLoading } = useQuery({
    queryKey: ['community/categories'],
    queryFn: () => api.get<{ categories: (CommunityCategory & { postCount: number })[] }>('/community/categories'),
  })

  const { data: postsResp, isLoading: postsLoading } = useQuery({
    queryKey: ['community/posts', category, sort, search, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category !== 'all') params.set('category', category)
      params.set('sort', sort)
      if (search) params.set('search', search)
      params.set('page', String(page))
      return api.get<{ posts: CommunityPost[]; totalPages: number }>(`/community/posts?${params}`)
    },
  })

  const categories = catResp?.categories ?? []
  const posts = postsResp?.posts ?? []
  const totalPages = postsResp?.totalPages ?? 1

  return (
    <AdminLayout portal="doctor">
      <div
        className="min-h-screen rounded-3xl space-y-6"
        style={{ background: 'linear-gradient(180deg, #F4FBF9 0%, #F0FDFA 60%, #E9F6F2 100%)' }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Community</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Ask questions, share knowledge with fellow doctors</p>
          </div>
          <button
            onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-xs font-bold shadow-lg shadow-teal-500/20 hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Ask the Community
          </button>
        </div>

        {/* Sort tabs + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {sortTabs.map((s) => (
              <button
                key={s.value}
                onClick={() => { setSort(s.value); setPage(1) }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sort === s.value
                    ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search discussions..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
          {/* Left sidebar — categories */}
          <div className="hidden lg:block space-y-2">
            <p className="text-[10px] font-extrabold uppercase text-slate-400 px-2 mb-3">Categories</p>
            <button
              onClick={() => { setCategory('all'); setPage(1) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                category === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              All Discussions
              <span className="ml-auto text-[10px] opacity-80">
                {categories.reduce((s, c) => s + c.postCount, 0)}
              </span>
            </button>
            {catLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-white rounded-xl animate-pulse border border-slate-100" />
                ))
              : categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCategory(c.slug); setPage(1) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      category === c.slug
                        ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-sm">
                      {c.icon ? String.fromCodePoint(parseInt(c.icon, 16)) : '•'}
                    </span>
                    {c.name}
                    <span className="ml-auto text-[10px] opacity-80">{c.postCount}</span>
                  </button>
                ))}
          </div>

          {/* Center feed */}
          <div className="space-y-4">
            {/* Mobile category chips */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <button
                onClick={() => { setCategory('all'); setPage(1) }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  category === 'all'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCategory(c.slug); setPage(1) }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                    category === c.slug
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {postsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center text-slate-400 text-sm">
                No discussions yet. Start one!
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/community/${post.id}`)}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xl hover:shadow-2xl hover:border-teal-200 transition-all cursor-pointer group"
                >
                  <div className="flex gap-4">
                    {/* Vote column */}
                    <div className="hidden sm:flex flex-col items-center gap-0.5 shrink-0">
                      <ChevronUp className="w-5 h-5 text-slate-300 group-hover:text-teal-500 transition-colors" />
                      <span className="text-sm font-black text-slate-700">{post.voteCount}</span>
                      <ChevronDown className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {post.doctor.photo ? (
                            <img src={post.doctor.photo} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            post.doctor.name.slice(0, 1)
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate">{post.doctor.name}</span>
                        {post.doctor.specialty && (
                          <span className="text-[10px] text-slate-400">· {post.doctor.specialty}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors mb-1.5 line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{post.body}</p>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.map((tag, i) => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tagColors[i % tagColors.length]}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold">
                        <span className="sm:hidden flex items-center gap-1">
                          <ChevronUp className="w-3.5 h-3.5" />
                          {post.voteCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {post.replyCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.viewCount}
                        </span>
                        <span className="ml-auto">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 font-bold">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="hidden lg:block space-y-6">
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-sm font-extrabold shadow-lg shadow-teal-500/20 hover:shadow-xl transition-all"
            >
              Ask the Community
            </button>
            <TrendingSidebar />
          </div>
        </div>
      </div>

      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} categories={categories} />}
    </AdminLayout>
  )
}

function TrendingSidebar() {
  const { data } = useQuery({
    queryKey: ['community/trending'],
    queryFn: () => api.get<{ posts: CommunityPost[] }>('/community/posts?sort=top&limit=5'),
  })
  const trending = data?.posts ?? []

  return (
    <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-orange-500" />
        <p className="text-[10px] font-extrabold uppercase text-slate-400">Trending</p>
      </div>
      {trending.length === 0 ? (
        <p className="text-[11px] text-slate-400">No trending posts yet.</p>
      ) : (
        <div className="space-y-3">
          {trending.map((post, i) => (
            <div key={post.id} className="flex items-start gap-2">
              <span className="text-[10px] font-black text-slate-300 mt-0.5">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{post.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ▲ {post.voteCount} · {post.replyCount} replies
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NewPostModal({
  onClose,
  categories,
}: {
  onClose: () => void
  categories: (CommunityCategory & { postCount: number })[]
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/community/posts', {
        title,
        body,
        categoryId: categoryId || undefined,
        tags,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community/posts'] })
      onClose()
    },
  })

  const addTags = (raw: string) => {
    const parts = raw.split(',').map((t) => t.trim()).filter(Boolean)
    setTags((prev) => [...new Set([...prev, ...parts])])
    setTagInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">New Discussion</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your question or share your experience..."
            rows={5}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500 resize-none"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTags(tagInput)
                }
              }}
              placeholder="Tags (comma-separated)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-[11px] font-bold">
                    {tag}
                    <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-teal-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {mutation.isError && (
          <p className="text-xs text-rose-600 font-bold">{mutation.error.message}</p>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || !body.trim() || mutation.isPending}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white text-xs font-extrabold shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Post Discussion
        </button>
      </div>
    </div>
  )
}
