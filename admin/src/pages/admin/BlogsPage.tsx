import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  RefreshCw,
  Search,
  FileText,
  Trash2,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { api } from '../../lib/api'
import { BlogPost, BlogPostsResponse } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'

export function BlogsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin/blog/posts', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (search) params.set('q', search)
      if (status !== 'all') params.set('status', status)
      return api.get<BlogPostsResponse>(`/admin/blog/posts?${params}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/blog/posts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin/blog/posts'] }),
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Blog Posts</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Manage articles, guides, and announcements.</p>
          </div>
          <Link
            to="/admin/blogs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> New Post
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin/blog/posts'] })}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {(data?.posts || []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={() => {
                    if (confirm('Delete this post?')) deleteMutation.mutate(post.id)
                  }}
                />
              ))}
              {!data?.posts.length && (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-bold">No posts found</p>
                  <p className="text-xs mt-1">Create your first blog post to get started.</p>
                </div>
              )}
            </div>

            {data && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1}–
                  {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of{' '}
                  {data.pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-600">
                    {data.pagination.page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page >= data.pagination.pages}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

function PostCard({ post, onDelete }: { post: BlogPost; onDelete: () => void }) {
  const isPublished = post.status === 'published'
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all group">
      <div className="shrink-0">
        {post.featuredImage ? (
          <img src={post.featuredImage} alt="" className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 truncate">{post.title}</h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPublished ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            {isPublished ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 truncate">{post.excerpt || 'No excerpt'}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
          <span>{post.category?.name || 'Uncategorized'}</span>
          {post.tags?.length ? <span>{post.tags.length} tag{post.tags.length > 1 ? 's' : ''}</span> : null}
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to={`/admin/blogs/${post.id}`}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" />
        </Link>
        {isPublished && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </a>
        )}
        <button onClick={onDelete} className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
