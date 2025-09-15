'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, ArrowLeft, Link as LinkIcon } from 'lucide-react'
import { joinTeam } from '@/lib/actions/teams'

export default function JoinTeamPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await joinTeam(inviteCode.trim())
      
      if (result.error) {
        setError(result.error)
      } else {
        // Redirect to the team
        router.push(`/app`)
      }
    } catch (error) {
      setError('An error occurred while joining the team')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold">Join a Team</h1>
        <p className="text-muted-foreground">
          Enter an invite code to join an existing team
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Team Invitation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Invite Code */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code *</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. team-slug or invitation-code"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the team slug or invitation code provided by your team admin
              </p>
            </div>

            {/* How to get invite code */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <LinkIcon className="h-4 w-4" />
                <span>How to get an invite code?</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ask your team admin for the team slug (e.g. "marketing-team")</li>
                <li>• Or request a specific invitation link</li>
                <li>• Team owners and admins can provide these from team settings</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !inviteCode.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isLoading ? 'Joining Team...' : 'Join Team'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alternative */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Don't have an invite code?
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/app/teams/new')}
        >
          Create Your Own Team
        </Button>
      </div>
    </div>
  )
}
