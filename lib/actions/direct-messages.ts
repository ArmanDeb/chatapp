'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  DirectMessage, 
  DirectMessageWithMessages, 
  ApiResponse 
} from '@/lib/types/app'

export async function createOrGetDirectMessage(otherUserId: string): Promise<ApiResponse<DirectMessage>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (otherUserId === user.id) {
    return { error: 'Cannot create DM with yourself' }
  }

  // Check if other user exists
  const { data: otherUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) {
    return { error: 'User not found' }
  }

  // Use the Supabase function to create or get DM
  const { data: dmId, error } = await supabase.rpc('create_or_get_dm', {
    other_user_id: otherUserId
  })

  if (error) {
    return { error: error.message }
  }

  // Get the full DM record
  const { data: dm, error: dmError } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('id', dmId)
    .single()

  if (dmError) {
    return { error: dmError.message }
  }

  revalidatePath('/app')
  return { data: dm }
}

export async function getDirectMessages(): Promise<ApiResponse<DirectMessageWithMessages[]>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: dms, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      user1:profiles!direct_messages_user1_id_fkey(*),
      user2:profiles!direct_messages_user2_id_fkey(*),
      messages(
        *,
        author:profiles(*)
      )
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Transform the data to include the other user and latest message
  const transformedDms = dms.map(dm => ({
    ...dm,
    messages: dm.messages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }))

  return { data: transformedDms as DirectMessageWithMessages[] }
}

export async function getDirectMessage(dmId: string): Promise<ApiResponse<DirectMessageWithMessages>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: dm, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      user1:profiles!direct_messages_user1_id_fkey(*),
      user2:profiles!direct_messages_user2_id_fkey(*),
      messages(
        *,
        author:profiles(*),
        reactions:message_reactions(
          *,
          user:profiles(*)
        )
      )
    `)
    .eq('id', dmId)
    .single()

  if (error) {
    return { error: error.message }
  }

  // Check if user is participant
  if (dm.user1_id !== user.id && dm.user2_id !== user.id) {
    return { error: 'Access denied' }
  }

  // Sort messages by creation time
  dm.messages = dm.messages.sort((a: any, b: any) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return { data: dm as DirectMessageWithMessages }
}

export async function getDirectMessagesList(): Promise<ApiResponse<Array<{
  id: string
  otherUser: any
  lastMessage?: any
  unreadCount: number
}>>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: dms, error } = await supabase
    .from('direct_messages')
    .select(`
      id,
      user1_id,
      user2_id,
      created_at,
      user1:profiles!direct_messages_user1_id_fkey(id, display_name, avatar_url, status),
      user2:profiles!direct_messages_user2_id_fkey(id, display_name, avatar_url, status)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  if (error) {
    return { error: error.message }
  }

  // Get last message for each DM
  const dmsWithLastMessage = await Promise.all(
    dms.map(async (dm) => {
      const { data: lastMessage } = await supabase
        .from('messages')
        .select(`
          *,
          author:profiles(display_name)
        `)
        .eq('dm_id', dm.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Determine the other user
      const otherUser = dm.user1_id === user.id ? dm.user2 : dm.user1

      // TODO: Implement unread count logic
      const unreadCount = 0

      return {
        id: dm.id,
        otherUser,
        lastMessage,
        unreadCount,
        created_at: dm.created_at
      }
    })
  )

  // Sort by last message time or creation time
  dmsWithLastMessage.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.created_at
    const bTime = b.lastMessage?.created_at || b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return { data: dmsWithLastMessage }
}

export async function deleteDirectMessage(dmId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is participant
  const { data: dm } = await supabase
    .from('direct_messages')
    .select('user1_id, user2_id')
    .eq('id', dmId)
    .single()

  if (!dm) {
    return { error: 'Direct message not found' }
  }

  if (dm.user1_id !== user.id && dm.user2_id !== user.id) {
    return { error: 'Access denied' }
  }

  // Delete the DM (this will cascade delete all messages due to foreign key constraints)
  const { error } = await supabase
    .from('direct_messages')
    .delete()
    .eq('id', dmId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Direct message conversation deleted successfully' }
}
