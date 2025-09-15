'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  FileUpload, 
  UploadedFile, 
  ApiResponse 
} from '@/lib/types/app'

export async function uploadFile(
  file: File,
  teamId: string,
  folder: 'messages' | 'avatars' | 'documents' = 'messages'
): Promise<ApiResponse<UploadedFile>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is member of the team
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { error: 'File size too large. Maximum size is 10MB.' }
  }

  // Generate unique filename
  const fileExtension = file.name.split('.').pop()
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileName = `${timestamp}_${randomString}.${fileExtension}`
  const filePath = `${teamId}/${folder}/${fileName}`

  try {
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        uploaded_by: user.id,
        team_id: teamId,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('files').remove([filePath])
      return { error: dbError.message }
    }

    revalidatePath('/app')
    return { 
      data: fileRecord as UploadedFile, 
      message: 'File uploaded successfully' 
    }
  } catch (error) {
    return { error: 'Failed to upload file' }
  }
}

export async function deleteFile(fileId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get file record
  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (fileError || !file) {
    return { error: 'File not found' }
  }

  // Check if user can delete (file uploader or team admin)
  const canDelete = file.uploaded_by === user.id || 
    await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', file.team_id!)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => data?.role === 'owner' || data?.role === 'admin')

  if (!canDelete) {
    return { error: 'Insufficient permissions' }
  }

  try {
    // Extract file path from URL
    const url = new URL(file.url)
    const filePath = url.pathname.split('/').slice(-3).join('/') // team_id/folder/filename

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([filePath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      return { error: dbError.message }
    }

    revalidatePath('/app')
    return { message: 'File deleted successfully' }
  } catch (error) {
    return { error: 'Failed to delete file' }
  }
}

export async function getTeamFiles(
  teamId: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<UploadedFile[]>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is member of the team
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  const { data: files, error } = await supabase
    .from('files')
    .select(`
      *,
      uploader:profiles!files_uploaded_by_fkey(
        display_name,
        avatar_url
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return { error: error.message }
  }

  return { data: files as UploadedFile[] }
}

export async function downloadFile(fileId: string): Promise<ApiResponse<string>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get file record
  const { data: file, error: fileError } = await supabase
    .from('files')
    .select('*, team_id')
    .eq('id', fileId)
    .single()

  if (fileError || !file) {
    return { error: 'File not found' }
  }

  // Check if user can access (team member)
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', file.team_id!)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  return { data: file.url }
}

export async function getFileInfo(fileId: string): Promise<ApiResponse<UploadedFile>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: file, error } = await supabase
    .from('files')
    .select(`
      *,
      uploader:profiles!files_uploaded_by_fkey(
        display_name,
        avatar_url
      )
    `)
    .eq('id', fileId)
    .single()

  if (error || !file) {
    return { error: 'File not found' }
  }

  // Check if user can access (team member)
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', file.team_id!)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  return { data: file as UploadedFile }
}

// Helper function to get file type category
export function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
