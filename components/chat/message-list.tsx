'use client'

import React, { useEffect, useRef } from 'react'
import { useChatContext } from './chat-context'
import { MessageItem } from './message-item'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function MessageList() {
  const { messages, isLoading, loadMoreMessages } = useChatContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle scroll to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    
    // If scrolled to top, load more messages
    if (scrollTop === 0 && scrollHeight > clientHeight) {
      loadMoreMessages()
    }
  }

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading messages...</span>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Be the first to start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      onScroll={handleScroll}
    >
      {/* Load more messages button */}
      <div className="flex justify-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={loadMoreMessages}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            'Load more messages'
          )}
        </Button>
      </div>

      {/* Messages */}
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
        
        // Group messages from same author within 5 minutes
        const shouldGroup = prevMessage &&
          prevMessage.author_id === message.author_id &&
          new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000

        const isLastInGroup = !nextMessage ||
          nextMessage.author_id !== message.author_id ||
          new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 5 * 60 * 1000

        return (
          <MessageItem
            key={message.id}
            message={message}
            showAuthor={!shouldGroup}
            showAvatar={isLastInGroup}
            isGrouped={shouldGroup}
          />
        )
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}
