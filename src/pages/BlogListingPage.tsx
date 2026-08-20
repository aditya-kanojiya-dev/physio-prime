import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, Search, RefreshCw, Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { BlogPost, BlogPostsResponse, BlogCategory, BlogTag } from '../types'

export function BlogListingPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['blog/posts', search, category, tag, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '9' })
      if (search) params.set('q', search)
      if (category) params.set('category', category)
      if (tag) params.set('tag', tag)
      return api.get<BlogPostsResponse>(`/blog/posts?${params}`)
    },
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['blog/categories'],
    queryFn: async () => api.get<{ categories: BlogCategory[] }>('/blog/categories'),
  })

  const { data: tagsData } = useQuery({
    queryKey: ['blog/tags'],
    queryFn: async () => api.get<{ tags: BlogTag[] }>('/blog/tags'),
  })

  const categories = categoriesData?.categories || []
  const tags = tagsData?.tags || []

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Health & Wellness Blog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Expert Physiotherapy <span className="text-gradient">Insights</span>
          </h1>
          <p className="text-slate-600 text-base">
            Stay informed with the latest articles on recovery, wellness, and physiotherapy from our certified specialists.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => { setTag(''); setPage(1) }}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                !tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              All
            </button>
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTag(t.slug === tag ? '' : t.slug); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  tag === t.slug ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(data?.posts || []).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {!data?.posts.length && (
              <div className="text-center py-16 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold">No articles found</p>
                <p className="text-xs mt-1">Check back soon for new content.</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-slate-600">
                  {data.pagination.page} / {data.pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                  disabled={page >= data.pagination.pages}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group glass-panel rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all flex flex-col"
    >
      {post.featuredImage ? (
        <div className="h-48 overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-blue-200" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              {post.category.name}
            </span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 flex-1">{post.excerpt}</p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t.id} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                {t.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:gap-2.5 transition-all">
          Read Article <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  )
}
