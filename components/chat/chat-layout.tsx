'use client'

import React from 'react'
import { ChatProvider } from './chat-context'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { ChatHeader } from './chat-header'

interface ChatLayoutProps {
  children?: React.ReactNode
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <ChatProvider>
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
