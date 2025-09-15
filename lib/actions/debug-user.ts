'use server'

import { createClient } from '@/lib/supabase/server'

export async function debugCurrentUser() {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'No authenticated user',
        userError: userError?.message
      }
    }

    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get auth.users info (if accessible)
    const { data: authUsers, error: authError } = await supabase
      .rpc('get_current_user_info')
      .single()

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError?.message,
      authUsers: authUsers || null,
      authError: authError?.message
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to create profile manually
export async function createCurrentUserProfile() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'No authenticated user'
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        display_name: user.email?.split('@')[0] || 'User'
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
