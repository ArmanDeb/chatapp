import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DebugTeamsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get all teams with their members
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select(`
      *,
      team_members(
        id,
        role,
        user_id,
        profiles(
          id,
          display_name,
          email
        )
      )
    `) as any

  // Get teams where current user is a member
  const { data: userTeams, error: userTeamsError } = await supabase
    .from('teams')
    .select(`
      *,
      team_members!inner(
        id,
        role,
        user_id,
        profiles(
          id,
          display_name,
          email
        )
      )
    `)
    .eq('team_members.user_id', user.id) as any

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🔍 Debug Teams & Ownership</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Current User</h2>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Teams ({teams?.length || 0})</h2>
        {teams?.map((team: any) => (
          <div key={team.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-bold">{team.name}</h3>
            <p><strong>Created by:</strong> {team.created_by}</p>
            <p><strong>You are creator:</strong> {team.created_by === user.id ? '✅ YES' : '❌ NO'}</p>
            
            <div className="mt-2">
              <strong>Members ({team.team_members?.length || 0}):</strong>
              {team.team_members?.length ? (
                <ul className="ml-4 mt-1">
                  {team.team_members.map((member: any) => (
                    <li key={member.id} className="flex items-center gap-2">
                      <span>{member.profiles?.display_name || member.profiles?.email}</span>
                      <span className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {member.user_id}
                      </span>
                      {member.user_id === user.id && (
                        <span className="text-green-600 font-bold">← YOU</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-500 ml-4">No members found!</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Teams ({userTeams?.length || 0})</h2>
        {userTeams?.map((team: any) => (
          <div key={team.id} className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <h3 className="font-bold">{team.name}</h3>
            <p><strong>Your role:</strong> {team.team_members?.[0]?.role}</p>
          </div>
        ))}
      </div>

      {teamsError && (
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <h3 className="font-bold text-red-800 dark:text-red-200">Teams Error:</h3>
          <p className="text-red-700 dark:text-red-300">{teamsError.message}</p>
        </div>
      )}

      {userTeamsError && (
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
          <h3 className="font-bold text-red-800 dark:text-red-200">User Teams Error:</h3>
          <p className="text-red-700 dark:text-red-300">{userTeamsError.message}</p>
        </div>
      )}

      <div className="mt-8">
        <a 
          href="/app" 
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
        >
          ← Back to App
        </a>
      </div>
    </div>
  )
}
