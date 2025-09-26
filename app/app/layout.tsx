import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { NavigationBar } from '@/components/layout/navigation-bar'
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
            {/* Navigation Bar */}
            <NavigationBar />
            
            {/* App Header (simplified) */}
            <div className="border-b bg-background px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold">ChatApp</h1>
                </div>
                <div className="flex items-center space-x-2">
                  {/* User info can go here */}
                </div>
              </div>
            </div>
            
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
