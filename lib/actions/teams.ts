'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { 
  CreateTeamForm, 
  Team, 
  TeamWithMembers, 
  ApiResponse 
} from '@/lib/types/app'

export async function createTeam(formData: CreateTeamForm): Promise<ApiResponse<Team>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if slug is already taken
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', formData.slug)
    .single()

  if (existingTeam) {
    return { error: 'Team slug already taken' }
  }

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      created_by: user.id,
    })
    .select()
    .single()

  if (teamError) {
    return { error: teamError.message }
  }

  // The trigger automatically:
  // 1. Adds creator as owner in team_members
  // 2. Creates default "general" channel
  // So we don't need to do it manually here

  revalidatePath('/app')
  return { data: team, message: 'Team created successfully' }
}

export async function getTeamById(teamId: string): Promise<ApiResponse<TeamWithMembers>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      *,
      channels (
        id,
        name,
        description,
        type,
        created_at
      ),
      team_members (
        id,
        role,
        joined_at,
        profiles (
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', teamId)
    .single()

  if (error) {
    return { error: error.message }
  }

  // Check if user is a member of this team
  const isMember = team.team_members.some(member => member.profiles.id === user.id)
  if (!isMember) {
    return { error: 'Access denied' }
  }

  return { data: team as TeamWithMembers }
}

export async function deleteTeam(teamId: string): Promise<ApiResponse<void>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is the owner of the team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'owner') {
    return { error: 'Only team owners can delete teams' }
  }

  // Get team info for confirmation
  const { data: team } = await supabase
    .from('teams')
    .select('name, created_by')
    .eq('id', teamId)
    .single()

  if (!team) {
    return { error: 'Team not found' }
  }

  // Double check: only the creator can delete
  if (team.created_by !== user.id) {
    return { error: 'Only the team creator can delete the team' }
  }

  // Delete team (CASCADE will handle related records)
  const { error: deleteError } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/app')
  return { message: 'Team deleted successfully' }
}

export async function getTeams(): Promise<ApiResponse<TeamWithMembers[]>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        id,
        role,
        joined_at,
        profiles(
          id,
          display_name,
          avatar_url
        )
      ),
      channels(
        id,
        name,
        description,
        type,
        created_at
      )
    `)
    .eq('team_members.user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { data: teams as TeamWithMembers[] }
}

export async function getTeam(teamId: string): Promise<ApiResponse<TeamWithMembers>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Access denied' }
  }

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      *,
      members:team_members(
        *,
        profile:profiles(*)
      ),
      channels(*)
    `)
    .eq('id', teamId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data: team as TeamWithMembers }
}

export async function updateTeam(
  teamId: string, 
  updates: Partial<CreateTeamForm>
): Promise<ApiResponse<Team>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Insufficient permissions' }
  }

  const { data: team, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { data: team, message: 'Team updated successfully' }
}


export async function joinTeam(inviteCode: string): Promise<ApiResponse<Team>> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Find team by invite code (for now, using slug as invite code)
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', inviteCode)
    .single()

  if (teamError || !team) {
    return { error: 'Invalid invite code' }
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return { error: 'Already a member of this team' }
  }

  // Add as member
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'member',
    })

  if (memberError) {
    return { error: memberError.message }
  }

  revalidatePath('/app')
  return { data: team, message: 'Successfully joined team' }
}

export async function leaveTeam(teamId: string): Promise<ApiResponse> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is the owner
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: 'Not a member of this team' }
  }

  if (membership.role === 'owner') {
    return { error: 'Owners cannot leave teams. Transfer ownership or delete the team.' }
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { message: 'Successfully left team' }
}
