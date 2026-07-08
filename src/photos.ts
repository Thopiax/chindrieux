import { supabase } from './store'

// Upload a photo to the public `photos` bucket under a random uuid key,
// returning its public URL for storage on an expense or oscar nomination.
export const uploadPhoto = async (file: File): Promise<string> => {
  const dot = file.name.lastIndexOf('.')
  const ext = dot >= 0 ? file.name.slice(dot) : ''
  const path = `${crypto.randomUUID()}${ext}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, { contentType: file.type || undefined })
  if (error) throw error

  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}
