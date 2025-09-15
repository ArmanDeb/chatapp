'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and account settings</p>
      </div>

      <div className="grid gap-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Theme</h4>
              <div className="flex space-x-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Browser Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Receive notifications even when the app is not active
                </p>
              </div>
              <Badge variant="secondary">
                {Notification?.permission === 'granted' ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            {Notification?.permission !== 'granted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => Notification.requestPermission()}
              >
                Enable Notifications
              </Button>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Notification Types</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>• Direct messages</span>
                  <Badge variant="outline" className="text-xs">Always</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Mentions (@username)</span>
                  <Badge variant="outline" className="text-xs">Always</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>• Channel messages</span>
                  <Badge variant="outline" className="text-xs">Configurable</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Account Security</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
                <Button variant="outline" size="sm">
                  Two-Factor Authentication
                  <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Privacy</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Your online status is visible to team members</p>
                <p>• Message history is stored securely</p>
                <p>• Files are encrypted in transit and at rest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Data & Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a copy of your messages and files
              </p>
              <Button variant="outline" size="sm">
                Request Export
                <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Storage Usage</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Messages: Unlimited</p>
                <p>• Files: 1GB per team (upgradeable)</p>
                <p>• Images: Optimized automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>About</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">ChatApp</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Version: 1.0.0 (MVP)</p>
                <p>Built with Next.js and Supabase</p>
                <p>Real-time team communication platform</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Danger Zone</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" size="sm">
                Delete Account
                <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
