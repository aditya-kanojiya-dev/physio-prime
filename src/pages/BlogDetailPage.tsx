import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, BookOpen, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { BlogPost } from '../types'

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['blog/post', slug],
    queryFn: async () => api.get<{ post: BlogPost }>(`/blog/posts/${slug}`),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !data?.post) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <BookOpen className="w-16 h-16 text-slate-300" />
        <h1 className="text-2xl font-black text-slate-900">Article Not Found</h1>
        <p className="text-sm">The article you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    )
  }

  const post = data.post

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> All Articles
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.category && (
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              {post.category.name}
            </span>
          )}
          {post.publishedAt && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-slate-500 leading-relaxed mb-6">{post.excerpt}</p>
        )}

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
            <img src={post.featuredImage} alt={post.title} className="w-full h-auto object-cover max-h-[480px]" />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 pb-6 border-b border-slate-200">
            <Tag className="w-4 h-4 text-slate-400" />
            {post.tags.map((t) => (
              <Link
                key={t.id}
                to={`/blog?tag=${t.slug}`}
                className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg prose-slate max-w-none
            prose-headings:font-extrabold prose-headings:text-slate-900
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:border prose-img:border-slate-200
            prose-strong:text-slate-900
            prose-blockquote:border-blue-500 prose-blockquote:text-slate-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Back to blog */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Articles
          </Link>
        </div>
      </article>
    </div>
  )
}
