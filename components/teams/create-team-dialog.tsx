'use client'

import { useState } from 'react'
import { createTeam } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CreateTeamDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTeamDialog({ isOpen, onClose }: CreateTeamDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Le nom de l\'équipe est requis')
      return
    }

    setIsCreating(true)

    try {
      const result = await createTeam({
        name: name.trim(),
        description: description.trim() || null
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Équipe créée avec succès!')
        setName('')
        setDescription('')
        onClose()
        // Refresh the page to show the new team
        window.location.reload()
      }
    } catch (error) {
      toast.error('Erreur lors de la création de l\'équipe')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle équipe</DialogTitle>
          <DialogDescription>
            Créez une équipe pour collaborer avec d'autres utilisateurs.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'équipe *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mon Équipe de Développement"
                disabled={isCreating}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le but de cette équipe..."
                rows={3}
                disabled={isCreating}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Création...' : 'Créer l\'équipe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
