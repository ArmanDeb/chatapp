'use client'

import React, { useEffect } from 'react'
import { ChatProvider, useChatContext } from './chat-context'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { ChatHeader } from './chat-header'
import { Channel } from '@/lib/types/app'

interface ChatLayoutProps {
<<<<<<< HEAD
  channel: Channel
  teamId: string
  channelId: string
  children?: React.ReactNode
}

export function ChatLayout({ channel, teamId, channelId, children }: ChatLayoutProps) {
  return (
    <ChatProvider channel={channel} teamId={teamId} channelId={channelId}>
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <ChatHeader />
        
        {/* Messages area */}
=======
  channel?: {
    id: string
    team_id: string
    name: string
    description: string | null
    is_private: boolean
    created_by: string
    created_at: string
    updated_at: string
  }
  teamId?: string
  channelId?: string
  dmData?: {
    id: string
    user1_id: string
    user2_id: string
    created_at: string
  }
  children?: React.ReactNode
}

function ChatLayoutContent({ channel, teamId, channelId, dmData, children }: ChatLayoutProps) {
  const { setCurrentChannel, setCurrentDM } = useChatContext()

  useEffect(() => {
    if (channel && channelId) {
      if (teamId === 'direct-message' && dmData) {
        // This is a direct message
        console.log('Setting currentDM:', dmData)
        setCurrentDM({
          id: dmData.id,
          user1_id: dmData.user1_id,
          user2_id: dmData.user2_id,
          created_at: dmData.created_at
        })
        setCurrentChannel(null)
      } else {
        // This is a regular channel
        setCurrentChannel({
          id: channel.id,
          team_id: channel.team_id,
          name: channel.name,
          description: channel.description,
          is_private: channel.is_private,
          created_by: channel.created_by,
          created_at: channel.created_at,
          updated_at: channel.updated_at
        })
        setCurrentDM(null)
      }
    }
  }, [channel, teamId, channelId, dmData, setCurrentChannel, setCurrentDM])

  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <ChatHeader />
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
>>>>>>> 867539d119015a6fc8bd101fbc6fdb2647c3a279
        <MessageList />
      </div>
      
      {/* Message input */}
      <MessageInput />
      
      {/* Additional children (e.g., sidebars, modals) */}
      {children}
    </div>
  )
}

export function ChatLayout(props: ChatLayoutProps) {
  return (
    <ChatProvider>
      <ChatLayoutContent {...props} />
    </ChatProvider>
  )
}
