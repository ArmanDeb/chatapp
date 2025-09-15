'use client'

import React, { useState, useRef } from 'react'
import { useChatContext } from './chat-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Send, 
  Paperclip, 
  Smile, 
  AtSign,
  Hash 
} from 'lucide-react'
import { SendMessageForm } from '@/lib/types/app'

export function MessageInput() {
  const { currentChannel, currentDM, sendMessage } = useChatContext()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() && !fileInputRef.current?.files?.[0]) return
    if (!currentChannel && !currentDM) return

    setIsLoading(true)
    try {
      const formData: SendMessageForm = {
        content: content.trim(),
        channel_id: currentChannel?.id,
        dm_id: currentDM?.id,
      }

      // Handle file upload if present
      if (fileInputRef.current?.files?.[0]) {
        formData.file = fileInputRef.current.files[0]
      }

      await sendMessage(formData)
      setContent('')
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getPlaceholder = () => {
    if (currentChannel) {
      return `Message #${currentChannel.name}`
    }
    if (currentDM) {
      return 'Send a direct message'
    }
    return 'Type a message...'
  }

  if (!currentChannel && !currentDM) {
    return null
  }

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="*/*"
          onChange={() => {
            // Could show file preview here
          }}
        />

        {/* Main input area */}
        <div className="flex items-end space-x-2">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFileSelect}
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            
            {/* Formatting hints */}
            <div className="absolute right-2 top-2 flex items-center space-x-1 text-muted-foreground">
              <button
                type="button"
                className="p-1 hover:bg-muted rounded"
                title="Mention someone"
              >
                <AtSign className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-muted rounded"
                title="Reference a channel"
              >
                <Hash className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-muted rounded"
                title="Add emoji"
              >
                <Smile className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() && !fileInputRef.current?.files?.[0] || isLoading}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* File preview */}
        {fileInputRef.current?.files?.[0] && (
          <div className="flex items-center justify-between bg-muted p-2 rounded">
            <span className="text-sm">
              📎 {fileInputRef.current.files[0].name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Formatting tips */}
        <div className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Use @username to mention someone, #channel to reference a channel. 
          Press Enter to send, Shift+Enter for new line.
        </div>
      </form>
    </div>
  )
}
