'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTeam } from '@/lib/actions/teams'
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
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: {
    id: string
    name: string
  }
  isOwner: boolean
  onTeamDeleted?: () => void
}

export function DeleteTeamDialog({ open, onOpenChange, team, isOwner, onTeamDeleted }: DeleteTeamDialogProps) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmValid = confirmText === team.name

  const handleDelete = async () => {
    if (!isConfirmValid || !isOwner) return

    setIsDeleting(true)

    try {
      const result = await deleteTeam(team.id)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Team deleted successfully')
        onOpenChange(false)
        onTeamDeleted?.() // Call the callback to reload teams
        router.push('/app')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setConfirmText('')
      onOpenChange(newOpen)
    }
  }

  if (!isOwner) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cannot Delete Team
            </DialogTitle>
            <DialogDescription>
              Only the team owner can delete this team. Contact the team owner if you need to delete this team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Team
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              This will permanently delete the team <strong>"{team.name}"</strong> and all of its data, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All channels and messages</li>
              <li>All team members</li>
              <li>All files and attachments</li>
              <li>All team settings and configurations</li>
            </ul>
            <p className="text-destructive font-medium">
              This action cannot be undone.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="confirm">
              Type <strong>{team.name}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={team.name}
              className="mt-1"
              disabled={isDeleting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
