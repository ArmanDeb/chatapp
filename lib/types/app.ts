import { Database } from './database'

// Re-export database types
export type UserStatus = Database['public']['Enums']['user_status']

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Application types
export type Profile = Tables<'profiles'>
export type Team = Tables<'teams'>
export type TeamMember = Tables<'team_members'>
export type Channel = Tables<'channels'>
export type ChannelMember = Tables<'channel_members'>
export type DirectMessage = Tables<'direct_messages'>
export type Message = Tables<'messages'>
export type MessageReaction = Tables<'message_reactions'>
export type UserPresence = Tables<'user_presence'>
export type Notification = Tables<'notifications'>
export type FileRecord = Tables<'files'>

// Extended types with relations
export interface MessageWithAuthor extends Message {
  author: Profile
  reactions?: MessageReactionWithUser[]
  replies?: Message[]
}

export interface MessageReactionWithUser extends MessageReaction {
  user: Profile
}

export interface TeamWithMembers extends Team {
  members: (TeamMember & { profile: Profile })[]
  channels: Channel[]
  _count?: {
    members: number
    channels: number
    messages: number
  }
}

export interface ChannelWithMessages extends Channel {
  messages: MessageWithAuthor[]
  members?: (ChannelMember & { profile: Profile })[]
}

export interface DirectMessageWithMessages extends DirectMessage {
  messages: MessageWithAuthor[]
  user1: Profile
  user2: Profile
}

export interface NotificationWithData extends Notification {
  data: {
    message_id?: string
    author_id?: string
    channel_id?: string
    dm_id?: string
    team_id?: string
    [key: string]: any
  }
}

// Form types
export interface CreateTeamForm {
  name: string
  description?: string
  slug: string
}

export interface CreateChannelForm {
  name: string
  description?: string
  is_private: boolean
  team_id: string
}

export interface SendMessageForm {
  content?: string
  channel_id?: string
  dm_id?: string
  parent_id?: string
  file?: File
}

export interface UpdateProfileForm {
  display_name?: string
  avatar_url?: string
  status?: Database['public']['Enums']['user_status']
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// Realtime subscription types
export interface RealtimeMessage {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

// Search types
export interface SearchResult {
  id: string
  content: string
  author_id: string
  channel_id: string | null
  dm_id: string | null
  created_at: string
  author_name: string
  channel_name: string | null
}

// Upload types
export interface FileUpload {
  file: File
  team_id?: string
  onProgress?: (progress: number) => void
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_by: string
  team_id: string | null
  created_at: string
}

// Presence types
export interface PresenceState {
  [userId: string]: {
    status: Database['public']['Enums']['user_status']
    last_seen: string
    user: Profile
  }
}

// Chat context types
export interface ChatContextType {
  currentTeam: Team | null
  currentChannel: Channel | null
  currentDM: DirectMessage | null
  messages: MessageWithAuthor[]
  isLoading: boolean
  sendMessage: (data: SendMessageForm) => Promise<void>
  loadMoreMessages: () => Promise<void>
  setCurrentTeam: (team: Team | null) => void
  setCurrentChannel: (channel: Channel | null) => void
  setCurrentDM: (dm: DirectMessage | null) => void
}

// Navigation types
export type NavigationItem = {
  id: string
  name: string
  type: 'team' | 'channel' | 'dm'
  unreadCount?: number
  isActive?: boolean
  href: string
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>
