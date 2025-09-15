import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { PresenceProvider } from '@/components/presence/presence-provider'
import { NotificationProvider } from '@/components/notifications/notification-provider'
import { Toaster } from 'sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <PresenceProvider>
      <NotificationProvider>
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <AppSidebar />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
        
        {/* Toast notifications */}
        <Toaster position="top-right" />
      </NotificationProvider>
    </PresenceProvider>
  )
}
