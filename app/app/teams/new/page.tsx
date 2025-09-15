'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowLeft, Plus } from 'lucide-react'
import { createTeam } from '@/lib/actions/teams'
import { CreateTeamForm } from '@/lib/types/app'

export default function NewTeamPage() {
  const [formData, setFormData] = useState<CreateTeamForm>({
    name: '',
    description: '',
    slug: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await createTeam(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        // Redirect to the new team
        router.push(`/app`)
      }
    } catch (error) {
      setError('An error occurred while creating the team')
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold">Create a New Team</h1>
        <p className="text-muted-foreground">
          Set up a new workspace for your team to collaborate
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Acme Corp, Marketing Team, Project Alpha"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                The name of your team or organization
              </p>
            </div>

            {/* Team Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Team URL *</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">chatapp.com/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="team-slug"
                  required
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be your team's unique URL. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's this team about? (optional)"
                className="w-full min-h-[80px] p-3 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={isLoading}
              />
            </div>

            {/* What happens next */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-4 h-4 p-0 text-xs flex items-center justify-center">1</Badge>
                  <span>Your team will be created with a #general channel</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-4 h-4 p-0 text-xs flex items-center justify-center">2</Badge>
                  <span>You'll be the team owner with full permissions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-4 h-4 p-0 text-xs flex items-center justify-center">3</Badge>
                  <span>You can invite team members and create more channels</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !formData.name.trim() || !formData.slug.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating Team...' : 'Create Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
