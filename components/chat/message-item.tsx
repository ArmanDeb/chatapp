'use client'

import React, { useState } from 'react'
import { MessageWithAuthor } from '@/lib/types/app'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Reply, 
  Edit, 
  Trash, 
  Copy,
  MessageSquare
} from 'lucide-react'
import { addReaction, updateMessage, deleteMessage } from '@/lib/actions/messages'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MessageItemProps {
  message: MessageWithAuthor
  showAuthor?: boolean
  showAvatar?: boolean
  isGrouped?: boolean
}

export function MessageItem({ 
  message, 
  showAuthor = true, 
  showAvatar = true,
  isGrouped = false 
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')
  const [isHovered, setIsHovered] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const isOwnMessage = user?.id === message.author_id

  const handleReaction = async (emoji: string) => {
    try {
      await addReaction(message.id, emoji)
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return
    
    try {
      await updateMessage(message.id, editContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating message:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return
    
    try {
      await deleteMessage(message.id)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '')
  }

  const getAuthorInitials = () => {
    const name = message.author.display_name || message.author.email
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: fr 
    })
  }

  // Group reactions by emoji
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, typeof message.reactions>)

  return (
    <div 
      className={`group relative ${isGrouped ? 'mt-1' : 'mt-4'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.author.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getAuthorInitials()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          {/* Author and timestamp */}
          {showAuthor && (
            <div className="flex items-baseline space-x-2">
              <span className="font-medium text-sm">
                {message.author.display_name || message.author.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.created_at)}
              </span>
              {message.updated_at !== message.created_at && (
                <Badge variant="secondary" className="text-xs">
                  edited
                </Badge>
              )}
            </div>
          )}

          {/* Message text */}
          <div className="mt-1">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleEdit}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(message.content || '')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </div>

          {/* File attachments */}
          {message.file_url && (
            <div className="mt-2">
              <div className="border rounded-lg p-3 max-w-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{message.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {message.file_size && `${(message.file_size / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={message.file_url} download>
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reactions */}
          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border hover:bg-muted transition-colors ${
                    reactions.some(r => r.user_id === user?.id)
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-muted/50'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{reactions.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Thread indicator */}
          {message.thread_count > 0 && (
            <button className="flex items-center space-x-1 mt-2 text-xs text-blue-600 hover:text-blue-800">
              <MessageSquare className="h-3 w-3" />
              <span>{message.thread_count} replies</span>
            </button>
          )}
        </div>

        {/* Message actions */}
        {(isHovered || isEditing) && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick reactions */}
            <div className="flex space-x-1">
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy text
                </DropdownMenuItem>
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
