import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChannelById } from '@/lib/actions/channels'
import { ChatLayout } from '@/components/chat/chat-layout'

interface ChannelPageProps {
  params: Promise<{
    teamId: string
    channelId: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { teamId, channelId } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get channel details
  const { data: channel, error: channelError } = await getChannelById(channelId)

  if (channelError || !channel) {
    redirect(`/app/teams/${teamId}`)
  }

  // Verify user has access to this channel
  const { data: membership } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/app')
  }

  return (
    <ChatLayout 
      channel={channel} 
      teamId={teamId}
      channelId={channelId}
    />
  )
}
