import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Image, RefreshCw, Trash2, Copy, Check, Folder } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AdminLayout } from '../../components/admin/AdminLayout'

interface StorageFile {
  name: string
  id: string
  created_at: string
  metadata: { size?: number; mimetype?: string }
}

const BUCKET = 'blog-images'

export function MediaLibraryPage() {
  const [copied, setCopied] = useState('')

  const { data: files, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin/media'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list('posts', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })
      if (error) throw error
      return (data || []) as StorageFile[]
    },
  })

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(`posts/${name}`)
    return data.publicUrl
  }

  const copyUrl = (name: string) => {
    navigator.clipboard.writeText(getPublicUrl(name))
    setCopied(name)
    setTimeout(() => setCopied(''), 2000)
  }

  const deleteFile = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return
    await supabase.storage.from(BUCKET).remove([`posts/${name}`])
    refetch()
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Media Library</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Manage uploaded images in Supabase Storage.</p>
          </div>
          <button onClick={() => refetch()} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            {!files?.length && (
              <div className="text-center py-16 text-slate-400">
                <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold">No files uploaded yet</p>
                <p className="text-xs mt-1">Upload images through the blog editor.</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(files || []).map((file) => {
                const url = getPublicUrl(file.name)
                return (
                  <div key={file.id} className="group rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="aspect-square bg-slate-100 overflow-hidden">
                      <img src={url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                      <p className="text-[10px] text-slate-400">{formatSize(file.metadata?.size)}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyUrl(file.name)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[10px] font-bold transition-all"
                        >
                          {copied === file.name ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy URL</>}
                        </button>
                        <button
                          onClick={() => deleteFile(file.name)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
