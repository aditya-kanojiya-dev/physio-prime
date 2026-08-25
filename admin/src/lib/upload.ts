import { supabase } from './supabase'

const BUCKET = 'blog-images'

export async function uploadImage(file: File, folder = 'misc'): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// keep existing name for backward compat
export const uploadBlogImage = (file: File) => uploadImage(file, 'posts')
