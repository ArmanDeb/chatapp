'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationWithData } from '@/lib/types/app'
// Removed deprecated useUser import
import { toast } from 'sonner'

interface NotificationContextType {
  notifications: NotificationWithData[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationWithData[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load initial notifications
  useEffect(() => {
    if (!user) return

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      setNotifications(data as NotificationWithData[])
    }

    loadNotifications()
  }, [user, supabase])

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as NotificationWithData
          setNotifications(prev => [newNotification, ...prev])
          
          // Show toast notification
          toast(newNotification.title, {
            description: newNotification.content,
            action: {
              label: 'View',
              onClick: () => {
                // Handle notification click - navigate to relevant page
                handleNotificationClick(newNotification)
              }
            }
          })

          // Request notification permission and show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.content || undefined,
              icon: '/favicon.ico',
              tag: newNotification.id
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as NotificationWithData
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === updatedNotification.id 
                ? updatedNotification 
                : notification
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedId = payload.old.id
          setNotifications(prev => 
            prev.filter(notification => notification.id !== deletedId)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleNotificationClick = (notification: NotificationWithData) => {
    // Handle navigation based on notification type
    const data = notification.data as any
    
    switch (notification.type) {
      case 'message':
        if (data?.channel_id) {
          // Navigate to channel
          window.location.href = `/app/teams/${data.team_id}/channels/${data.channel_id}`
        }
        break
      case 'dm':
        if (data?.dm_id) {
          // Navigate to DM
          window.location.href = `/app/dms/${data.dm_id}`
        }
        break
      case 'mention':
        if (data?.message_id) {
          // Navigate to message
          if (data.channel_id) {
            window.location.href = `/app/teams/${data.team_id}/channels/${data.channel_id}?message=${data.message_id}`
          } else if (data.dm_id) {
            window.location.href = `/app/dms/${data.dm_id}?message=${data.message_id}`
          }
        }
        break
      default:
        break
    }
  }

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error marking notification as read:', error)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [user, supabase])

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [user, supabase])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error deleting notification:', error)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [user, supabase])

  const clearAll = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error clearing all notifications:', error)
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }, [user, supabase])

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
