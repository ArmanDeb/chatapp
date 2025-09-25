import { createClient } from '@/lib/supabase/server'
import { getDirectMessagesList } from '@/lib/actions/direct-messages'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { UserSelector } from '@/components/direct-messages/user-selector'

export default async function DirectMessagesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  const dmsResult = await getDirectMessagesList()

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Messages privés</h1>
            <p className="text-sm text-muted-foreground">
              Conversations directes avec d'autres utilisateurs
            </p>
          </div>
          <UserSelector />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {dmsResult.error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-500">
                Erreur : {dmsResult.error}
              </div>
            </CardContent>
          </Card>
        ) : dmsResult.data && dmsResult.data.length > 0 ? (
          <div className="grid gap-4">
            {dmsResult.data.map((dm) => (
              <Card key={dm.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href={`/app/dms/${dm.id}`} className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={dm.otherUser?.avatar_url} />
                      <AvatarFallback>
                        {dm.otherUser?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">
                        {dm.otherUser?.display_name || 'Utilisateur inconnu'}
                      </h3>
                      {dm.lastMessage ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {dm.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucun message
                        </p>
                      )}
                    </div>
                    {dm.unreadCount > 0 && (
                      <div className="bg-blue-500 text-white text-sm rounded-full px-2 py-1">
                        {dm.unreadCount}
                      </div>
                    )}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez une nouvelle conversation avec un autre utilisateur
                </p>
                <UserSelector />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
