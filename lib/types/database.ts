export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserStatus = 'online' | 'away' | 'busy' | 'offline'
export type MessageType = 'text' | 'file' | 'image' | 'system'
export type TeamRole = 'owner' | 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          status: UserStatus
          last_seen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          status?: UserStatus
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          status?: UserStatus
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          slug: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          slug: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          slug?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: TeamRole
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: TeamRole
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: TeamRole
          joined_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          team_id: string
          name: string
          description: string | null
          is_private: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          description?: string | null
          is_private?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      direct_messages: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string | null
          type: MessageType
          author_id: string
          channel_id: string | null
          dm_id: string | null
          file_url: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          parent_id: string | null
          thread_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content?: string | null
          type?: MessageType
          author_id: string
          channel_id?: string | null
          dm_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          parent_id?: string | null
          thread_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string | null
          type?: MessageType
          author_id?: string
          channel_id?: string | null
          dm_id?: string | null
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          parent_id?: string | null
          thread_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      user_presence: {
        Row: {
          user_id: string
          status: UserStatus
          last_seen: string
          updated_at: string
        }
        Insert: {
          user_id: string
          status?: UserStatus
          last_seen?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          status?: UserStatus
          last_seen?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string | null
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string | null
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          name: string
          size: number
          type: string
          url: string
          uploaded_by: string
          team_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          size: number
          type: string
          url: string
          uploaded_by: string
          team_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          size?: number
          type?: string
          url?: string
          uploaded_by?: string
          team_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_or_get_dm: {
        Args: {
          other_user_id: string
        }
        Returns: string
      }
      update_user_presence: {
        Args: {
          new_status?: UserStatus
        }
        Returns: undefined
      }
      get_team_stats: {
        Args: {
          team_uuid: string
        }
        Returns: {
          member_count: number
          channel_count: number
          message_count: number
          online_members: number
        }[]
      }
      search_messages: {
        Args: {
          search_query: string
          team_uuid?: string
          channel_uuid?: string
          limit_count?: number
        }
        Returns: {
          id: string
          content: string
          author_id: string
          channel_id: string | null
          dm_id: string | null
          created_at: string
          author_name: string
          channel_name: string | null
        }[]
      }
    }
    Enums: {
      user_status: UserStatus
      message_type: MessageType
      team_role: TeamRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
