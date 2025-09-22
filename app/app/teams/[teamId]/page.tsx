import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeamById } from '@/lib/actions/teams'

interface TeamPageProps {
  params: Promise<{
    teamId: string
  }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get team details
  const { data: team, error: teamError } = await getTeamById(teamId)

  if (teamError || !team) {
    redirect('/app')
  }

  // Redirect to the first channel (usually 'general')
  const firstChannel = team.channels?.[0]
  if (firstChannel) {
    redirect(`/app/teams/${teamId}/channels/${firstChannel.id}`)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to {team.name}!</h1>
        <p className="text-muted-foreground mb-6">
          This team doesn't have any channels yet.
        </p>
        <a
          href={`/app/teams/${teamId}/settings`}
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
        >
          Team Settings
        </a>
      </div>
    </div>
  )
}
