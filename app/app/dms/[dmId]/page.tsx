import { createClient } from '@/lib/supabase/server'
import { getDirectMessage } from '@/lib/actions/direct-messages'
import { redirect } from 'next/navigation'
import { ChatLayout } from '@/components/chat/chat-layout'

interface DirectMessagePageProps {
  params: {
    dmId: string
  }
}

export default async function DirectMessagePage({ params }: DirectMessagePageProps) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get direct message details
  const { data: dm, error: dmError } = await getDirectMessage((await params).dmId)

  if (dmError || !dm) {
    redirect('/app/dms')
  }

  // Verify user has access to this conversation
  if (dm.user1_id !== user.id && dm.user2_id !== user.id) {
    redirect('/app/dms')
  }

  // Create a mock channel object for ChatLayout compatibility
  const mockChannel = {
    id: dm.id,
    team_id: 'direct-message',
    name: dm.user1_id === user.id ? dm.user2?.display_name || 'Utilisateur' : dm.user1?.display_name || 'Utilisateur',
    description: 'Conversation privée',
    is_private: true,
    created_by: user.id,
    created_at: dm.created_at,
    updated_at: dm.created_at
  }

  // Prepare DM data for the context
  const dmData = {
    id: dm.id,
    user1_id: dm.user1_id,
    user2_id: dm.user2_id,
    created_at: dm.created_at
  }

  return (
    <ChatLayout 
      channel={mockChannel} 
      teamId="direct-message"
      channelId={dm.id}
      dmData={dmData}
    />
  )
}
