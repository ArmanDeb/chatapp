'use client'

import React from 'react'
import { useChatContext } from './chat-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Hash, 
  Lock, 
  Users, 
  Settings, 
  UserPlus,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react'

export function ChatHeader() {
  const { currentChannel, currentDM, currentTeam } = useChatContext()

  if (!currentChannel && !currentDM) {
    return (
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-center text-muted-foreground">
          Select a channel or start a conversation
        </div>
      </div>
    )
  }

  const getOtherUser = () => {
    if (!currentDM) return null
    // This would need to be properly implemented with user data
    return currentDM.user1_id // Placeholder
  }

  const getChannelIcon = () => {
    if (currentChannel?.is_private) {
      return <Lock className="h-4 w-4" />
    }
    return <Hash className="h-4 w-4" />
  }

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Channel/DM info */}
        <div className="flex items-center space-x-3">
          {currentChannel && (
            <>
              <div className="flex items-center space-x-2">
                {getChannelIcon()}
                <h2 className="text-lg font-semibold">
                  {currentChannel.name}
                </h2>
                {currentChannel.is_private && (
                  <Badge variant="secondary" className="text-xs">
                    Private
                  </Badge>
                )}
              </div>
              {currentChannel.description && (
                <span className="text-sm text-muted-foreground border-l pl-3">
                  {currentChannel.description}
                </span>
              )}
            </>
          )}

          {currentDM && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback>
                  DM
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">
                  Direct Message
                </h2>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Channel actions */}
          {currentChannel && (
            <>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Members
              </Button>
              <Button variant="ghost" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </>
          )}

          {/* DM actions */}
          {currentDM && (
            <>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentChannel && (
                <>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Channel settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="h-4 w-4 mr-2" />
                    Manage members
                  </DropdownMenuItem>
                  {currentChannel.is_private && (
                    <DropdownMenuItem>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add members
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {currentDM && (
                <>
                  <DropdownMenuItem>
                    View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Block user
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Channel/Team breadcrumb */}
      {currentTeam && currentChannel && (
        <div className="mt-2 text-sm text-muted-foreground">
          <span>{currentTeam.name}</span>
          <span className="mx-2">•</span>
          <span>{currentChannel.name}</span>
        </div>
      )}
    </div>
  )
}
