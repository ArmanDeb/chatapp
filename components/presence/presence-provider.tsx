'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PresenceState, UserStatus } from '@/lib/types/app'
// Removed deprecated useUser import

interface PresenceContextType {
  presenceState: PresenceState
  updateStatus: (status: UserStatus) => Promise<void>
  isOnline: (userId: string) => boolean
  getUserStatus: (userId: string) => UserStatus
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined)

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
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

  // Update user status
  const updateStatus = useCallback(async (status: UserStatus) => {
    if (!user) return

    try {
      const { error } = await supabase.rpc('update_user_presence', {
        new_status: status
      })

      if (error) {
        console.error('Error updating presence:', error)
      }
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }, [user, supabase])

  // Set user online when component mounts
  useEffect(() => {
    if (!user) return

    updateStatus('online')

    // Set user offline when page is closed
    const handleBeforeUnload = () => {
      updateStatus('offline')
    }

    // Set user offline when page loses focus for extended time
    let offlineTimeout: NodeJS.Timeout
    const handleVisibilityChange = () => {
      if (document.hidden) {
        offlineTimeout = setTimeout(() => {
          updateStatus('away')
        }, 5 * 60 * 1000) // 5 minutes
      } else {
        clearTimeout(offlineTimeout)
        updateStatus('online')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Periodic heartbeat to keep user online
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        updateStatus('online')
      }
    }, 30 * 1000) // 30 seconds

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(heartbeatInterval)
      clearTimeout(offlineTimeout)
      updateStatus('offline')
    }
  }, [user, updateStatus])

  // Subscribe to presence changes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        async (payload) => {
          // Fetch updated user profile with presence
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new?.user_id || payload.old?.user_id)
            .single()

          if (profile) {
            const userId = profile.id
            const presence = payload.new || payload.old

            if (payload.eventType === 'DELETE' || !presence) {
              setPresenceState(prev => {
                const newState = { ...prev }
                delete newState[userId]
                return newState
              })
            } else {
              setPresenceState(prev => ({
                ...prev,
                [userId]: {
                  status: presence.status,
                  last_seen: presence.last_seen,
                  user: profile
                }
              }))
            }
          }
        }
      )
      .subscribe()

    // Load initial presence data
    const loadInitialPresence = async () => {
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          status,
          last_seen,
          user:profiles(*)
        `)

      if (presenceData) {
        const initialState: PresenceState = {}
        presenceData.forEach((presence: any) => {
          initialState[presence.user_id] = {
            status: presence.status,
            last_seen: presence.last_seen,
            user: presence.user
          }
        })
        setPresenceState(initialState)
      }
    }

    loadInitialPresence()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const isOnline = useCallback((userId: string) => {
    const presence = presenceState[userId]
    if (!presence) return false
    
    const lastSeen = new Date(presence.last_seen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    
    return presence.status === 'online' && diffMinutes < 5
  }, [presenceState])

  const getUserStatus = useCallback((userId: string) => {
    const presence = presenceState[userId]
    if (!presence) return 'offline'
    
    const lastSeen = new Date(presence.last_seen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60)
    
    // If user hasn't been seen in 5 minutes, consider them offline
    if (diffMinutes > 5) return 'offline'
    
    return presence.status
  }, [presenceState])

  const value: PresenceContextType = {
    presenceState,
    updateStatus,
    isOnline,
    getUserStatus
  }

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const context = useContext(PresenceContext)
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider')
  }
  return context
}
