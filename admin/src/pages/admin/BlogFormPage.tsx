import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Eye,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { uploadBlogImage } from '../../lib/upload'
import { BlogPost, BlogCategory, BlogTag } from '../../lib/types'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { confirmDialog } from '../../components/admin/ConfirmDialog'
import { TipTapEditor } from '../../components/admin/TipTapEditor'
import { hasErrors, maxLen, slug as slugRule, type Errors } from '../../lib/validate'
import { Field } from './CategoriesPage'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export interface BlogScope {
  /** API prefix, e.g. `/admin/blog`. */
  base: string
  /** Post-list route to return to. */
  listPath: string
  /** Must match the `queryKey` prefix used by the list page. */
  listKey: string
  portal: 'admin' | 'doctor'
  subtitle: string
}

const ADMIN_BLOG_SCOPE: BlogScope = {
  base: '/admin/blog',
  listPath: '/admin/blogs',
  listKey: 'admin/blog/posts',
  portal: 'admin',
  subtitle: 'Create a new article for your blog.',
}

export function BlogFormPage({ scope = ADMIN_BLOG_SCOPE }: { scope?: BlogScope }) {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [slugEdited, setSlugEdited] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState<Errors<'title' | 'slug' | 'excerpt' | 'content'>>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const imageFileRef = useRef<HTMLInputElement>(null)

  const { data: existing, isLoading: loadingPost } = useQuery({
    queryKey: [scope.base, 'post', id],
    queryFn: async () => api.get<{ post: BlogPost }>(`${scope.base}/posts/${id}`),
    enabled: !isNew && !!id,
  })

  const { data: categoriesData } = useQuery({
    queryKey: [scope.base, 'categories'],
    queryFn: async () => api.get<{ categories: BlogCategory[] }>(`${scope.base}/categories`),
  })

  const { data: tagsData } = useQuery({
    queryKey: [scope.base, 'tags'],
    queryFn: async () => api.get<{ tags: BlogTag[] }>(`${scope.base}/tags`),
  })

  useEffect(() => {
    if (existing?.post) {
      const p = existing.post
      setTitle(p.title)
      setSlug(p.slug)
      setExcerpt(p.excerpt || '')
      setContent(p.content)
      setFeaturedImage(p.featuredImage || '')
      setStatus(p.status)
      setCategoryId(p.categoryId)
      setSelectedTagIds(p.tags?.map((t) => t.id) || [])
      setSlugEdited(true)
    }
  }, [existing])

  useEffect(() => {
    if (!slugEdited && title) setSlug(slugify(title))
  }, [title, slugEdited])

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (isNew) return api.post<{ post: BlogPost }>(`${scope.base}/posts`, payload)
      return api.patch<{ post: BlogPost }>(`${scope.base}/posts/${id}`, payload)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [scope.listKey] })
      navigate(`${scope.listPath}/${res.post.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`${scope.base}/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [scope.listKey] })
      navigate(scope.listPath)
    },
  })

  const handleSave = (asStatus?: 'draft' | 'published') => {
    const plain = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
    const next: Errors<'title' | 'slug' | 'excerpt' | 'content'> = {
      title: title ? maxLen(title, 200, 'Title') : 'Title is required',
      slug: slugRule(slug.trim()),
      excerpt: excerpt ? maxLen(excerpt, 500, 'Excerpt') : undefined,
      content: plain ? undefined : 'Content is required',
    }
    setErrors(next)
    if (hasErrors(next)) return
    saveMutation.mutate({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt || null,
      content,
      featuredImage: featuredImage || null,
      status: asStatus || status,
      categoryId,
      tagIds: selectedTagIds,
    })
  }

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setUploadError(null)
    try {
      const url = await uploadBlogImage(file)
      setFeaturedImage(url)
    } catch (err) {
      setUploadError(`Image upload failed: ${(err as Error).message}`)
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const categories = categoriesData?.categories || []
  const tags = tagsData?.tags || []

  return (
    <AdminLayout portal={scope.portal}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(scope.listPath)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isNew ? 'New Blog Post' : 'Edit Blog Post'}
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {isNew ? scope.subtitle : `Editing: ${existing?.post?.title || ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={async () => { if (await confirmDialog({ title: 'Delete Post', message: `Delete this post?` })) deleteMutation.mutate() }}
                className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSave('draft')}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
            >
              {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>

        {saveMutation.isError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {(saveMutation.error as Error).message || 'Failed to save'}
          </div>
        )}

        {loadingPost ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5">
              <Field label="Title" error={errors.title}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setErrors((p) => ({ ...p, title: undefined }))
                  }}
                  placeholder="Enter post title..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                />
              </Field>

              <Field label="Slug" error={errors.slug}>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSlugEdited(true)
                    setErrors((p) => ({ ...p, slug: undefined }))
                  }}
                  placeholder="post-url-slug"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-mono focus:outline-none focus:border-teal-500 transition-colors"
                />
              </Field>

              <Field label="Excerpt" error={errors.excerpt}>
                <textarea
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value)
                    setErrors((p) => ({ ...p, excerpt: undefined }))
                  }}
                  placeholder="Short summary for listings..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </Field>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Featured Image</label>
                <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {uploadError && (
                  <div role="alert" className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
                    {uploadError}
                  </div>
                )}
                {featuredImage ? (
                  <div className="relative">
                    <img src={featuredImage} alt="Preview" className="h-40 w-full rounded-xl object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-red-50 border border-slate-200 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageFileRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-all"
                  >
                    {uploadingImage ? (
                      <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-400" />
                    )}
                    <span className="text-xs font-bold text-slate-500">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200">
              <label className="block text-xs font-bold text-slate-600 mb-3">Content</label>
              <TipTapEditor content={content} onChange={setContent} />
              {errors.content && (
                <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">{errors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 rounded-3xl bg-white border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-2">Category</label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {!tags.length && <p className="text-xs text-slate-400">No tags available.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
