'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  UpdateProfileForm, 
  Profile, 
  ApiResponse,
  UserStatus 
} from '@/lib/types/app'

export async function updateProfile(formData: UpdateProfileForm): Promise<ApiResponse<Profile>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      display_name: formData.display_name,
      avatar_url: formData.avatar_url,
      status: formData.status,
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { data: profile, message: 'Profile updated successfully' }
}

export async function updateUserStatus(status: UserStatus): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  try {
    const { error } = await supabase.rpc('update_user_presence', {
      new_status: status
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/app')
    return { message: 'Status updated successfully' }
  } catch (error) {
    return { error: 'Failed to update status' }
  }
}

export async function getProfile(userId?: string): Promise<ApiResponse<Profile>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const targetUserId = userId || user.id

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: profile }
}

export async function uploadAvatar(file: File): Promise<ApiResponse<string>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  if (file.size > 2 * 1024 * 1024) { // 2MB
    return { error: 'File size must be less than 2MB' }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  try {
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      return { error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      return { error: updateError.message }
    }

    revalidatePath('/app')
    return { data: urlData.publicUrl, message: 'Avatar updated successfully' }
  } catch (error) {
    return { error: 'Failed to upload avatar' }
  }
}
