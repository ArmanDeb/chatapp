'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserStatus } from '@/components/presence/user-status'
import { 
  Hash, 
  Lock, 
  Plus, 
  ChevronDown,
  MessageSquare,
  Users,
  Settings,
  MoreHorizontal,
  Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Team, Channel, DirectMessage } from '@/lib/types/app'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DeleteTeamDialog } from '@/components/teams/delete-team-dialog'

import { UserSelector } from '@/components/direct-messages/user-selector'

export function AppSidebar() {
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [dms, setDms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const supabase = createClient()
  const pathname = usePathname()

  // Function to reload teams (we'll use this after deletion)
  const reloadTeams = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Get teams where user is a member (using the old working method)
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          team_members!inner(user_id)
        `)
        .eq('team_members.user_id', user.id)

      if (teamsData && teamsData.length > 0) {
        // Get team members and channels separately for each team
        const fullTeamsData = []
        
        for (const team of teamsData) {
          // Get team members for this team
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select(`
              id,
              role,
              user_id,
              profiles(
                id,
                display_name,
                email,
                avatar_url
              )
            `)
            .eq('team_id', team.id)

          // Get channels for this team
          const { data: channels } = await supabase
            .from('channels')
            .select('*')
            .eq('team_id', team.id)
            
          // Combine the data
          const fullTeam = {
            ...team,
            team_members: teamMembers || [],
            channels: channels || []
          }
          
          fullTeamsData.push(fullTeam)
        }

        setTeams(fullTeamsData as Team[])
        
        // Update current team if it still exists, otherwise clear it
        const teamIdFromUrl = pathname.split('/')[3]
        const currentTeamData = fullTeamsData.find(t => t.id === teamIdFromUrl) || fullTeamsData[0]
        setCurrentTeam(currentTeamData as Team || null)
      } else {
        // No teams left
        setTeams([])
        setCurrentTeam(null)
      }
    } catch (error) {
      console.error('Error reloading teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Load user's teams
  useEffect(() => {
    if (!user) return
    reloadTeams()
  }, [user, supabase, pathname])

  // Load channels for current team
  useEffect(() => {
    if (!currentTeam || !user) return

    const loadChannels = async () => {
      try {
        const { data: channelsData } = await supabase
          .from('channels')
          .select('*')
          .eq('team_id', currentTeam.id)
          .or(`is_private.eq.false,id.in.(${
            // Get private channels user is member of
            await supabase
              .from('channel_members')
              .select('channel_id')
              .eq('user_id', user.id)
              .then(({ data }) => data?.map(m => m.channel_id).join(',') || 'null')
          })`)
          .order('name')

        if (channelsData) {
          setChannels(channelsData)
        }
      } catch (error) {
        console.error('Error loading channels:', error)
      }
    }

    loadChannels()
  }, [currentTeam, user, supabase])

  // Load direct messages - ALWAYS load regardless of team membership
  useEffect(() => {
    if (!user) return

    const loadDMs = async () => {
      try {
        const { data: dmsData } = await supabase
          .from('direct_messages')
          .select(`
            *,
            user1:profiles!direct_messages_user1_id_fkey(id, display_name, avatar_url),
            user2:profiles!direct_messages_user2_id_fkey(id, display_name, avatar_url)
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (dmsData) {
          // Transform to show the other user
          const transformedDMs = dmsData.map(dm => ({
            ...dm,
            otherUser: dm.user1_id === user.id ? dm.user2 : dm.user1
          }))
          setDms(transformedDMs)
        }
      } catch (error) {
        console.error('Error loading DMs:', error)
      }
    }

    loadDMs()
  }, [user, supabase])

  const isChannelActive = (channelId: string) => {
    return pathname.includes(`/channels/${channelId}`)
  }

  const isDMActive = (dmId: string) => {
    return pathname.includes(`/dms/${dmId}`)
  }

  // Check if current user is owner of current team
  const isCurrentTeamOwner = currentTeam && user && 
    currentTeam.team_members?.some(member => 
      member?.profiles?.id === user.id && member?.role === 'owner'
    )

  if (isLoading) {
    return (
      <aside className="w-64 bg-muted/50 border-r flex flex-col">
        <div className="p-4">
          <div className="h-6 bg-muted rounded animate-pulse" />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-muted/50 border-r flex flex-col">
      {/* Team selector */}
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <div className="flex items-center min-w-0 flex-1">
                {currentTeam ? (
                  <>
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-primary">
                        {currentTeam.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-semibold text-sm truncate">
                        {currentTeam.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {currentTeam.team_members?.length || 0} members
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-semibold text-sm truncate">
                      Messages Privés
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {dms.length} conversations
                    </div>
                  </div>
                )}
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Your Teams ({teams.length})
            </div>
            {teams.map(team => (
              <DropdownMenuItem 
                key={team.id}
                onClick={() => setCurrentTeam(team)}
                className="flex flex-col items-start space-y-1 p-3 group"
              >
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-primary">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {team.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {team.description || 'No description'}
                    </div>
                  </div>
                  {currentTeam?.id === team.id && (
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full ml-2" />
                  )}
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{team.team_members?.length || 0} members</span>
                    <span className="mx-2">•</span>
                    <Hash className="h-3 w-3 mr-1" />
                    <span>{team.channels?.length || 0} channels</span>
                  </div>
                  {user && team.team_members?.some(member => 
                    member?.profiles?.id === user.id && member?.role === 'owner'
                  ) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {teams.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Aucune équipe trouvée
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {currentTeam ? (
          <>
            {/* Channels section */}
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Channels
                </h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-0.5">
                {channels.map(channel => (
                  <Link
                    key={channel.id}
                    href={`/app/teams/${currentTeam.id}/channels/${channel.id}`}
                    className={`flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
                      isChannelActive(channel.id) ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    {channel.is_private ? (
                      <Lock className="h-3 w-3 mr-2 flex-shrink-0" />
                    ) : (
                      <Hash className="h-3 w-3 mr-2 flex-shrink-0" />
                    )}
                    <span className="truncate">{channel.name}</span>
                    {/* TODO: Add unread count */}
                  </Link>
                ))}
              </div>
            </div>

            {/* Direct Messages section */}
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Direct Messages
                </h3>
                <UserSelector><Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button></UserSelector>
              </div>
              <div className="space-y-0.5">
                {dms.map(dm => (
                  <Link
                    key={dm.id}
                    href={`/app/dms/${dm.id}`}
                    className={`flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
                      isDMActive(dm.id) ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <div className="relative mr-2">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={dm.otherUser?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {dm.otherUser?.display_name?.[0] || dm.otherUser?.id?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <UserStatus 
                        userId={dm.otherUser?.id || ''} 
                        size="sm" 
                        className="absolute -bottom-0.5 -right-0.5 border border-background" 
                      />
                    </div>
                    <span className="truncate">
                      {dm.otherUser?.display_name || 'Unknown User'}
                    </span>
                    {/* TODO: Add unread count */}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Show only Direct Messages when no team is selected */
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Direct Messages
              </h3>
              <UserSelector><Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button></UserSelector>
            </div>
            <div className="space-y-0.5">
              {dms.map(dm => (
                <Link
                  key={dm.id}
                  href={`/app/dms/${dm.id}`}
                  className={`flex items-center px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
                    isDMActive(dm.id) ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  <div className="relative mr-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={dm.otherUser?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {dm.otherUser?.display_name?.[0] || dm.otherUser?.id?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <UserStatus 
                      userId={dm.otherUser?.id || ''} 
                      size="sm" 
                      className="absolute -bottom-0.5 -right-0.5 border border-background" 
                    />
                  </div>
                  <span className="truncate">
                    {dm.otherUser?.display_name || 'Unknown User'}
                  </span>
                  {/* TODO: Add unread count */}
                </Link>
              ))}
              {dms.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Aucune conversation
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <UserStatus 
              userId={user?.id || ''} 
              size="sm" 
              className="absolute -bottom-0.5 -right-0.5 border-2 border-background" 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.display_name || user?.email}
            </p>
            <UserStatus userId={user?.id || ''} showText size="sm" />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete team dialog - Only render when there's a current team */}
      {currentTeam && (
        <DeleteTeamDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          team={currentTeam}
          onTeamDeleted={reloadTeams}
        />
      )}
    </aside>
  )
}
