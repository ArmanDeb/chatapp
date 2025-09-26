'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  MessageSquare, 
  Plus, 
  Users,
  Settings
} from 'lucide-react'
import { CreateTeamDialog } from '@/components/teams/create-team-dialog'
import { JoinTeamDialog } from '@/components/teams/join-team-dialog'

export function NavigationBar() {
  const pathname = usePathname()
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showJoinTeam, setShowJoinTeam] = useState(false)

  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === '/app' || pathname.startsWith('/app/teams')
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      <nav className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo et navigation principale */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/app" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">C</span>
                  </div>
                  <span className="font-bold text-lg">ChatApp</span>
                </Link>
              </div>

              {/* Navigation principale */}
              <div className="hidden md:flex space-x-1">
                <Link href="/app">
                  <Button
                    variant={isActive('/app') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Équipes</span>
                  </Button>
                </Link>
                
                <Link href="/app/dms">
                  <Button
                    variant={isActive('/app/dms') ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Messages Privés</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center space-x-4">
              {/* Boutons d'équipe */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateTeam(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Créer Équipe</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJoinTeam(true)}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Rejoindre</span>
                </Button>
              </div>

              {/* Menu mobile */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateTeam(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation mobile */}
          <div className="md:hidden border-t border-border">
            <div className="flex space-x-1 py-2">
              <Link href="/app" className="flex-1">
                <Button
                  variant={isActive('/app') ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Équipes</span>
                </Button>
              </Link>
              
              <Link href="/app/dms" className="flex-1">
                <Button
                  variant={isActive('/app/dms') ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinTeam(true)}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Rejoindre</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dialogs */}
      <CreateTeamDialog
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
      />
      
      <JoinTeamDialog
        isOpen={showJoinTeam}
        onClose={() => setShowJoinTeam(false)}
      />
    </>
  )
}
