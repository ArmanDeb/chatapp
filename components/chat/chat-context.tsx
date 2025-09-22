'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChatContextType, 
  Team, 
  Channel, 
  DirectMessage, 
  MessageWithAuthor,
  SendMessageForm 
} from '@/lib/types/app'
import { sendMessage, getMessages } from '@/lib/actions/messages'
// Removed deprecated useUser import

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
  children: React.ReactNode
  channel?: Channel
  teamId?: string
  channelId?: string
}

export function ChatProvider({ children, channel, teamId, channelId }: ChatProviderProps) {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(channel || null)
  const [currentDM, setCurrentDM] = useState<DirectMessage | null>(null)
  const [messages, setMessages] = useState<MessageWithAuthor[]>([] as MessageWithAuthor[])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Load messages when channel or DM changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentChannel && !currentDM) return
      
      setIsLoading(true)
      try {
        const result = await getMessages(
          currentChannel?.id,
          currentDM?.id,
          1,
          50
        )
        
        if (result.data) {
          setMessages(result.data)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [currentChannel?.id, currentDM?.id])

  // Set up realtime subscription for messages
  useEffect(() => {
    if (!currentChannel && !currentDM) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: currentChannel 
            ? `channel_id=eq.${currentChannel.id}`
            : `dm_id=eq.${currentDM!.id}`
        },
        async (payload) => {
          // Fetch the complete message with author info
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              author:profiles(*),
              reactions:message_reactions(
                *,
                user:profiles(*)
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages(prev => [...prev, newMessage as MessageWithAuthor])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: currentChannel 
            ? `channel_id=eq.${currentChannel.id}`
            : `dm_id=eq.${currentDM!.id}`
        },
        async (payload) => {
          // Fetch the updated message with author info
          const { data: updatedMessage } = await supabase
            .from('messages')
            .select(`
              *,
              author:profiles(*),
              reactions:message_reactions(
                *,
                user:profiles(*)
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (updatedMessage) {
            setMessages(prev => {
              const messages: MessageWithAuthor[] = prev
              return messages.map((msg: MessageWithAuthor) => 
                msg.id === updatedMessage.id 
                  ? updatedMessage as MessageWithAuthor 
                  : msg
              )
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: currentChannel 
            ? `channel_id=eq.${currentChannel.id}`
            : `dm_id=eq.${currentDM!.id}`
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChannel?.id, currentDM?.id, supabase])

  // Set up realtime subscription for message reactions
  useEffect(() => {
    if (!currentChannel && !currentDM) return

    const channel = supabase
      .channel('message_reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions'
        },
        async (payload) => {
          // Update the specific message's reactions
          const messageId = payload.new?.message_id || payload.old?.message_id
          
          // Refetch reactions for this message
          const { data: reactions } = await supabase
            .from('message_reactions')
            .select(`
              *,
              user:profiles(*)
            `)
            .eq('message_id', messageId)

          if (reactions) {
            setMessages(prev => {
              const messages: MessageWithAuthor[] = prev
              return messages.map((msg: MessageWithAuthor) => 
                msg.id === messageId 
                  ? { ...msg, reactions }
                  : msg
              )
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChannel?.id, currentDM?.id, supabase])

  const handleSendMessage = useCallback(async (formData: SendMessageForm) => {
    try {
      const result = await sendMessage(formData)
      if (result.error) {
        throw new Error(result.error)
      }
      // Message will be added via realtime subscription
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [])

  const loadMoreMessages = useCallback(async () => {
    if (!currentChannel && !currentDM) return
    
    const currentPage = Math.ceil(messages.length / 50) + 1
    
    try {
      const result = await getMessages(
        currentChannel?.id,
        currentDM?.id,
        currentPage,
        50
      )
      
      if (result.data && result.data.length > 0) {
        setMessages(prev => [...result.data!, ...prev])
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    }
  }, [currentChannel?.id, currentDM?.id, messages.length])

  const value: ChatContextType = {
    currentTeam,
    currentChannel,
    currentDM,
    messages,
    isLoading,
    sendMessage: handleSendMessage,
    loadMoreMessages,
    setCurrentTeam,
    setCurrentChannel,
    setCurrentDM,
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
