'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusIndicator } from '@/components/presence/user-status'
import { Upload, Save, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, uploadAvatar, getProfile } from '@/lib/actions/profile'
import { Profile, UserStatus } from '@/lib/types/app'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<UserStatus>('online')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const result = await getProfile()
        if (result.data) {
          setProfile(result.data)
          setDisplayName(result.data.display_name || '')
          setStatus(result.data.status)
        }
      }
      setIsLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSave = async () => {
    if (!profile) return
    
    setIsSaving(true)
    try {
      const result = await updateProfile({
        display_name: displayName,
        status: status,
      })
      
      if (result.error) {
        alert(result.error)
      } else {
        alert('Profile updated successfully!')
        setProfile(result.data!)
      }
    } catch (error) {
      alert('Error updating profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const result = await uploadAvatar(file)
      
      if (result.error) {
        alert(result.error)
      } else {
        alert('Avatar updated successfully!')
        // Refresh profile
        const profileResult = await getProfile()
        if (profileResult.data) {
          setProfile(profileResult.data)
        }
      }
    } catch (error) {
      alert('Error uploading avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    const name = profile?.display_name || user.email || ''
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <StatusIndicator 
                status={status} 
                size="lg" 
                className="absolute -bottom-1 -right-1 border-2 border-background" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Change Avatar'}
                </Button>
              </div>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={user?.email || ''} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed from here
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: UserStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status="online" size="sm" />
                    <span>Online</span>
                  </div>
                </SelectItem>
                <SelectItem value="away">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status="away" size="sm" />
                    <span>Away</span>
                  </div>
                </SelectItem>
                <SelectItem value="busy">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status="busy" size="sm" />
                    <span>Busy</span>
                  </div>
                </SelectItem>
                <SelectItem value="offline">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status="offline" size="sm" />
                    <span>Appear Offline</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Info */}
          <div className="space-y-2">
            <Label>Account Information</Label>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Created:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
              <p><strong>Last Sign In:</strong> {new Date(user?.last_sign_in_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
