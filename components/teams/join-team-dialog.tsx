'use client'

import { useState, useEffect } from 'react'
import { joinTeam } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface JoinTeamDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function JoinTeamDialog({ isOpen, onClose }: JoinTeamDialogProps) {
  const [teamCode, setTeamCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [availableTeams, setAvailableTeams] = useState<any[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const supabase = createClient()

  // Load available teams when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableTeams()
    }
  }, [isOpen])

  const loadAvailableTeams = async () => {
    setIsLoadingTeams(true)
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error loading teams:', error)
      } else {
        setAvailableTeams(teams || [])
      }
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamCode.trim()) {
      toast.error('Le code d\'équipe est requis')
      return
    }

    setIsJoining(true)

    try {
      const result = await joinTeam(teamCode.trim())

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Vous avez rejoint l\'équipe avec succès!')
        setTeamCode('')
        onClose()
        // Refresh the page to show the new team
        window.location.reload()
      }
    } catch (error) {
      toast.error('Erreur lors de la tentative de rejoindre l\'équipe')
    } finally {
      setIsJoining(false)
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    setIsJoining(true)

    try {
      const result = await joinTeam(teamId)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Vous avez rejoint l\'équipe avec succès!')
        onClose()
        // Refresh the page to show the new team
        window.location.reload()
      }
    } catch (error) {
      toast.error('Erreur lors de la tentative de rejoindre l\'équipe')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rejoindre une équipe</DialogTitle>
          <DialogDescription>
            Rejoignez une équipe existante en utilisant un code d'invitation ou en sélectionnant une équipe publique.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Join by code */}
          <form onSubmit={handleJoinByCode}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamCode">Code d'invitation</Label>
                <Input
                  id="teamCode"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  placeholder="Entrez le code d'invitation..."
                  disabled={isJoining}
                />
              </div>
              
              <Button type="submit" disabled={isJoining} className="w-full">
                {isJoining ? 'Rejoindre...' : 'Rejoindre avec le code'}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>

          {/* Available teams */}
          <div className="space-y-4">
            <Label>Équipes disponibles</Label>
            
            {isLoadingTeams ? (
              <div className="text-center py-4 text-muted-foreground">
                Chargement des équipes...
              </div>
            ) : availableTeams.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={isJoining}
                    >
                      Rejoindre
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Aucune équipe disponible
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isJoining}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
