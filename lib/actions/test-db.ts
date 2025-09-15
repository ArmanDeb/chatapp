'use server'

import { createClient } from '@/lib/supabase/server'

export async function testDatabaseConnection() {
  const supabase = await createClient()
  
  try {
    // Test if tables exist
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('count')
      .limit(1)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    return {
      success: true,
      tables: {
        teams: !teamsError,
        profiles: !profilesError,
      },
      errors: {
        teams: teamsError?.message,
        profiles: profilesError?.message,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
