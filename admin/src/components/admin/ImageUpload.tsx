import React, { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { uploadImage } from '../../lib/upload'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
}

export function ImageUpload({ value, onChange, folder = 'misc', label = 'Image' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="font-bold text-slate-600">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden">
          <img src={value} alt="" className="w-full h-40 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all backdrop-blur-sm"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all backdrop-blur-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-2 transition-all text-slate-400 hover:text-blue-500"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
          <span className="text-xs font-bold">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
        </button>
      )}

      {error && <p className="text-[11px] text-rose-600 font-bold">{error}</p>}
    </div>
  )
}
