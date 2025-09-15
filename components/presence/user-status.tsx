'use client'

import React from 'react'
import { usePresence } from './presence-provider'
import { UserStatus as UserStatusType } from '@/lib/types/app'
import { Badge } from '@/components/ui/badge'

interface UserStatusProps {
  userId: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserStatus({ 
  userId, 
  showText = false, 
  size = 'md',
  className = '' 
}: UserStatusProps) {
  const { getUserStatus, isOnline } = usePresence()
  const status = getUserStatus(userId)
  const online = isOnline(userId)

  const getStatusColor = (status: UserStatusType) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status: UserStatusType) => {
    switch (status) {
      case 'online': return 'Online'
      case 'away': return 'Away'
      case 'busy': return 'Busy'
      case 'offline': return 'Offline'
      default: return 'Offline'
    }
  }

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'w-2 h-2'
      case 'md': return 'w-3 h-3'
      case 'lg': return 'w-4 h-4'
      default: return 'w-3 h-3'
    }
  }

  if (showText) {
    return (
      <Badge 
        variant={online ? 'default' : 'secondary'}
        className={`text-xs ${className}`}
      >
        <div className={`${getSizeClass(size)} ${getStatusColor(status)} rounded-full mr-1`} />
        {getStatusText(status)}
      </Badge>
    )
  }

  return (
    <div 
      className={`${getSizeClass(size)} ${getStatusColor(status)} rounded-full ${className}`}
      title={getStatusText(status)}
    />
  )
}

export function StatusIndicator({ 
  status, 
  size = 'md',
  className = '' 
}: { 
  status: UserStatusType
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const getStatusColor = (status: UserStatusType) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm': return 'w-2 h-2'
      case 'md': return 'w-3 h-3'
      case 'lg': return 'w-4 h-4'
      default: return 'w-3 h-3'
    }
  }

  return (
    <div 
      className={`${getSizeClass(size)} ${getStatusColor(status)} rounded-full ${className}`}
    />
  )
}
