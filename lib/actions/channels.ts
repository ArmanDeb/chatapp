'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  CreateChannelForm, 
  Channel, 
  ChannelWithMessages, 
  ApiResponse 
} from '@/lib/types/app'

export async function createChannel(formData: CreateChannelForm): Promise<ApiResponse<Channel>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is member of the team
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', formData.team_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  // Check if channel name already exists in team
  const { data: existingChannel } = await supabase
    .from('channels')
    .select('id')
    .eq('team_id', formData.team_id)
    .eq('name', formData.name)
    .single()

  if (existingChannel) {
    return { error: 'Channel name already exists in this team' }
  }

  // Create channel
  const { data: channel, error } = await supabase
    .from('channels')
    .insert({
      ...formData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // If private channel, add creator as member
  if (formData.is_private) {
    await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: user.id,
      })
  }

  revalidatePath('/app')
  return { data: channel, message: 'Channel created successfully' }
}

export async function getChannelById(channelId: string): Promise<ApiResponse<Channel>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: channel, error } = await supabase
    .from('channels')
    .select(`
      *,
      teams (
        id,
        name,
        slug
      )
    `)
    .eq('id', channelId)
    .single()

  if (error) {
    return { error: error.message }
  }

  // Check if user is a member of the team that owns this channel
  const { data: membership } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', channel.team_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  return { data: channel as Channel }
}

export async function getChannels(teamId: string): Promise<ApiResponse<Channel[]>> {
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

  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .eq('team_id', teamId)
    .or(`is_private.eq.false,id.in.(${
      // Get private channels user is member of
      await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id)
        .then(({ data }) => data?.map(m => m.channel_id).join(',') || 'null')
    })`)
    .order('name')

  if (error) {
    return { error: error.message }
  }

  return { data: channels }
}

export async function getChannel(channelId: string): Promise<ApiResponse<ChannelWithMessages>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get channel with access check
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select(`
      *,
      messages(
        *,
        author:profiles(*),
        reactions:message_reactions(
          *,
          user:profiles(*)
        )
      )
    `)
    .eq('id', channelId)
    .single()

  if (channelError) {
    return { error: channelError.message }
  }

  // Check access
  const { data: teamMembership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', channel.team_id)
    .eq('user_id', user.id)
    .single()

  if (!teamMembership) {
    return { error: 'Access denied' }
  }

  // For private channels, check specific membership
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

  return { data: channel as ChannelWithMessages }
}

export async function updateChannel(
  channelId: string,
  updates: Partial<Omit<CreateChannelForm, 'team_id'>>
): Promise<ApiResponse<Channel>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get channel to check permissions
  const { data: channel } = await supabase
    .from('channels')
    .select('*, team_id')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found' }
  }

  // Check if user can update (creator or team admin)
  const canUpdate = channel.created_by === user.id || 
    await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', channel.team_id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => data?.role === 'owner' || data?.role === 'admin')

  if (!canUpdate) {
    return { error: 'Insufficient permissions' }
  }

  const { data: updatedChannel, error } = await supabase
    .from('channels')
    .update(updates)
    .eq('id', channelId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { data: updatedChannel, message: 'Channel updated successfully' }
}

export async function deleteChannel(channelId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get channel to check permissions
  const { data: channel } = await supabase
    .from('channels')
    .select('*, team_id')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found' }
  }

  // Prevent deleting 'general' channel
  if (channel.name === 'general') {
    return { error: 'Cannot delete the general channel' }
  }

  // Check if user can delete (creator or team admin)
  const canDelete = channel.created_by === user.id || 
    await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', channel.team_id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => data?.role === 'owner' || data?.role === 'admin')

  if (!canDelete) {
    return { error: 'Insufficient permissions' }
  }

  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Channel deleted successfully' }
}

export async function joinChannel(channelId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get channel
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single()

  if (!channel) {
    return { error: 'Channel not found' }
  }

  if (!channel.is_private) {
    return { error: 'Cannot join public channels' }
  }

  // Check team membership
  const { data: teamMembership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', channel.team_id)
    .eq('user_id', user.id)
    .single()

  if (!teamMembership) {
    return { error: 'Must be team member to join channel' }
  }

  // Check if already member
  const { data: existingMember } = await supabase
    .from('channel_members')
    .select('id')
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { error: 'Already a member of this channel' }
  }

  const { error } = await supabase
    .from('channel_members')
    .insert({
      channel_id: channelId,
      user_id: user.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Successfully joined channel' }
}

export async function leaveChannel(channelId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('channel_id', channelId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Successfully left channel' }
}
