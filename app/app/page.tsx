import { createClient } from '@/lib/supabase/server'
import { getTeams } from '@/lib/actions/teams'
import { testDatabaseConnection } from '@/lib/actions/test-db'
import { redirect } from 'next/navigation'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Test database connection
  const dbTest = await testDatabaseConnection()
  
  // Get user's teams
  const teamsResult = await getTeams()
  
  if (teamsResult.data && teamsResult.data.length > 0) {
    // Redirect to first team's general channel
    const firstTeam = teamsResult.data[0]
    const generalChannel = firstTeam.channels.find(c => c.name === 'general')
    
    if (generalChannel) {
      redirect(`/app/teams/${firstTeam.id}/channels/${generalChannel.id}`)
    } else {
      redirect(`/app/teams/${firstTeam.id}`)
    }
  }

  // If no teams, show welcome page
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to ChatApp!</h1>
          <p className="text-muted-foreground">
            Real-time team communication made simple. Get started by creating your first team or joining an existing one.
          </p>
        </div>
        
        <div className="space-y-3">
          <a 
            href="/app/teams/new" 
            className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <span>✨</span>
            <span>Create a Team</span>
          </a>
          <a 
            href="/app/teams/join" 
            className="block w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <span>🔗</span>
            <span>Join a Team</span>
          </a>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg text-left">
          <h3 className="font-medium mb-2">✅ What you can do:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Create teams and channels</li>
            <li>• Send messages in real-time</li>
            <li>• Share files and documents</li>
            <li>• Direct messaging (DM)</li>
            <li>• Manage your online status</li>
          </ul>
        </div>

        <div className={`mt-6 p-4 rounded-lg text-left ${
          dbTest.success 
            ? 'bg-green-50 dark:bg-green-950/20' 
            : 'bg-red-50 dark:bg-red-950/20'
        }`}>
          <h3 className={`font-medium mb-2 ${
            dbTest.success 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {dbTest.success ? '✅ Database Status:' : '❌ Database Status:'}
          </h3>
          <div className={`text-sm space-y-1 ${
            dbTest.success 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-red-700 dark:text-red-300'
          }`}>
            <p>• Tables: {dbTest.tables?.teams ? '✅' : '❌'} teams, {dbTest.tables?.profiles ? '✅' : '❌'} profiles</p>
            {!dbTest.success && (
              <p>• Error: {dbTest.error}</p>
            )}
            {dbTest.errors?.teams && (
              <p>• Teams table: {dbTest.errors.teams}</p>
            )}
            {dbTest.errors?.profiles && (
              <p>• Profiles table: {dbTest.errors.profiles}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
