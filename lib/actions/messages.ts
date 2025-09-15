'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  SendMessageForm, 
  MessageWithAuthor, 
  ApiResponse,
  PaginatedResponse 
} from '@/lib/types/app'

export async function sendMessage(formData: SendMessageForm): Promise<ApiResponse<MessageWithAuthor>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Validate that message has either channel_id or dm_id
  if (!formData.channel_id && !formData.dm_id) {
    return { error: 'Message must belong to either a channel or direct message' }
  }

  if (formData.channel_id && formData.dm_id) {
    return { error: 'Message cannot belong to both channel and direct message' }
  }

  // Validate access
  if (formData.channel_id) {
    const { data: channel } = await supabase
      .from('channels')
      .select('*, team_id')
      .eq('id', formData.channel_id)
      .single()

    if (!channel) {
      return { error: 'Channel not found' }
    }

    // Check team membership
    const { data: teamMembership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', channel.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMembership) {
      return { error: 'Access denied' }
    }

    // Check private channel membership
    if (channel.is_private) {
      const { data: channelMembership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', formData.channel_id)
        .eq('user_id', user.id)
        .single()

      if (!channelMembership) {
        return { error: 'Access denied to private channel' }
      }
    }
  }

  if (formData.dm_id) {
    const { data: dm } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('id', formData.dm_id)
      .single()

    if (!dm) {
      return { error: 'Direct message conversation not found' }
    }

    // Check if user is participant
    if (dm.user1_id !== user.id && dm.user2_id !== user.id) {
      return { error: 'Access denied' }
    }
  }

  // Create message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      content: formData.content,
      author_id: user.id,
      channel_id: formData.channel_id,
      dm_id: formData.dm_id,
      parent_id: formData.parent_id,
      file_url: formData.file ? 'temp-url' : null, // Will be updated after file upload
    })
    .select(`
      *,
      author:profiles(*),
      reactions:message_reactions(
        *,
        user:profiles(*)
      )
    `)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { data: message as MessageWithAuthor, message: 'Message sent successfully' }
}

export async function getMessages(
  channelId?: string,
  dmId?: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<MessageWithAuthor>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (!channelId && !dmId) {
    return { error: 'Must specify either channel or DM' }
  }

  let query = supabase
    .from('messages')
    .select(`
      *,
      author:profiles(*),
      reactions:message_reactions(
        *,
        user:profiles(*)
      )
    `)
    .is('parent_id', null) // Only get top-level messages, not replies
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (channelId) {
    // Validate channel access
    const { data: channel } = await supabase
      .from('channels')
      .select('*, team_id')
      .eq('id', channelId)
      .single()

    if (!channel) {
      return { error: 'Channel not found' }
    }

    const { data: teamMembership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', channel.team_id)
      .eq('user_id', user.id)
      .single()

    if (!teamMembership) {
      return { error: 'Access denied' }
    }

    if (channel.is_private) {
      const { data: channelMembership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .single()

      if (!channelMembership) {
        return { error: 'Access denied to private channel' }
      }
    }

    query = query.eq('channel_id', channelId)
  }

  if (dmId) {
    // Validate DM access
    const { data: dm } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('id', dmId)
      .single()

    if (!dm) {
      return { error: 'Direct message conversation not found' }
    }

    if (dm.user1_id !== user.id && dm.user2_id !== user.id) {
      return { error: 'Access denied' }
    }

    query = query.eq('dm_id', dmId)
  }

  const { data: messages, error, count } = await query

  if (error) {
    return { error: error.message }
  }

  return {
    data: (messages as MessageWithAuthor[]).reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: (count || 0) > page * limit
    }
  }
}

export async function getMessageReplies(messageId: string): Promise<ApiResponse<MessageWithAuthor[]>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get parent message to validate access
  const { data: parentMessage } = await supabase
    .from('messages')
    .select('channel_id, dm_id')
    .eq('id', messageId)
    .single()

  if (!parentMessage) {
    return { error: 'Message not found' }
  }

  // Validate access (similar to getMessages)
  if (parentMessage.channel_id) {
    const { data: channel } = await supabase
      .from('channels')
      .select('*, team_id')
      .eq('id', parentMessage.channel_id)
      .single()

    if (channel) {
      const { data: teamMembership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', channel.team_id)
        .eq('user_id', user.id)
        .single()

      if (!teamMembership) {
        return { error: 'Access denied' }
      }
    }
  }

  if (parentMessage.dm_id) {
    const { data: dm } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('id', parentMessage.dm_id)
      .single()

    if (dm && dm.user1_id !== user.id && dm.user2_id !== user.id) {
      return { error: 'Access denied' }
    }
  }

  const { data: replies, error } = await supabase
    .from('messages')
    .select(`
      *,
      author:profiles(*),
      reactions:message_reactions(
        *,
        user:profiles(*)
      )
    `)
    .eq('parent_id', messageId)
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data: replies as MessageWithAuthor[] }
}

export async function updateMessage(
  messageId: string,
  content: string
): Promise<ApiResponse<MessageWithAuthor>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user owns the message
  const { data: message } = await supabase
    .from('messages')
    .select('author_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found' }
  }

  if (message.author_id !== user.id) {
    return { error: 'Can only edit your own messages' }
  }

  const { data: updatedMessage, error } = await supabase
    .from('messages')
    .update({ content })
    .eq('id', messageId)
    .select(`
      *,
      author:profiles(*),
      reactions:message_reactions(
        *,
        user:profiles(*)
      )
    `)
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { data: updatedMessage as MessageWithAuthor, message: 'Message updated successfully' }
}

export async function deleteMessage(messageId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user owns the message
  const { data: message } = await supabase
    .from('messages')
    .select('author_id')
    .eq('id', messageId)
    .single()

  if (!message) {
    return { error: 'Message not found' }
  }

  if (message.author_id !== user.id) {
    return { error: 'Can only delete your own messages' }
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Message deleted successfully' }
}

export async function addReaction(
  messageId: string,
  emoji: string
): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if reaction already exists
  const { data: existingReaction } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existingReaction) {
    // Remove reaction if it exists
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existingReaction.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/app')
    return { message: 'Reaction removed' }
  }

  // Add new reaction
  const { error } = await supabase
    .from('message_reactions')
    .insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Reaction added' }
}

export async function searchMessages(
  query: string,
  teamId?: string,
  channelId?: string,
  limit: number = 50
): Promise<ApiResponse<any[]>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: results, error } = await supabase.rpc('search_messages', {
    search_query: query,
    team_uuid: teamId,
    channel_uuid: channelId,
    limit_count: limit
  })

  if (error) {
    return { error: error.message }
  }

  return { data: results }
}
