'use client'

import React from 'react'
import { ChatProvider } from './chat-context'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { ChatHeader } from './chat-header'
import { Channel } from '@/lib/types/app'

interface ChatLayoutProps {
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
        <MessageList />
        
        {/* Message input */}
        <MessageInput />
      </div>
      
      {/* Additional children (e.g., sidebars, modals) */}
      {children}
    </ChatProvider>
  )
}
