import { testDatabaseConnection } from '@/lib/actions/test-db'

export default async function TestPage() {
  const dbTest = await testDatabaseConnection()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Database Test</h1>
      
      <div className={`p-4 rounded-lg ${
        dbTest.success 
          ? 'bg-green-50 dark:bg-green-950/20' 
          : 'bg-red-50 dark:bg-red-950/20'
      }`}>
        <h2 className={`font-medium mb-2 ${
          dbTest.success 
            ? 'text-green-800 dark:text-green-200' 
            : 'text-red-800 dark:text-red-200'
        }`}>
          {dbTest.success ? '✅ Database Status: OK' : '❌ Database Status: ERROR'}
        </h2>
        
        <div className={`text-sm space-y-2 ${
          dbTest.success 
            ? 'text-green-700 dark:text-green-300' 
            : 'text-red-700 dark:text-red-300'
        }`}>
          <div>
            <strong>Tables Status:</strong>
            <ul className="ml-4 mt-1">
              <li>• Teams table: {dbTest.tables?.teams ? '✅ OK' : '❌ Missing'}</li>
              <li>• Profiles table: {dbTest.tables?.profiles ? '✅ OK' : '❌ Missing'}</li>
            </ul>
          </div>
          
          {!dbTest.success && (
            <div>
              <strong>Error Details:</strong>
              <p className="mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs">
                {dbTest.error}
              </p>
            </div>
          )}
          
          {dbTest.errors?.teams && (
            <div>
              <strong>Teams Table Error:</strong>
              <p className="mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs">
                {dbTest.errors.teams}
              </p>
            </div>
          )}
          
          {dbTest.errors?.profiles && (
            <div>
              <strong>Profiles Table Error:</strong>
              <p className="mt-1 bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs">
                {dbTest.errors.profiles}
              </p>
            </div>
          )}
        </div>
      </div>

      {!dbTest.success && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
          <h3 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
            🔧 Quick Fix
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Run this SQL script in your Supabase Dashboard → SQL Editor:
          </p>
          <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`-- Quick setup script
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;`}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
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
