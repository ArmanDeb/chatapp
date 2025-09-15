-- Fix the duplicate team member issue
-- Run this in Supabase Dashboard → SQL Editor

-- 1. First, let's clean up any existing duplicate entries
DELETE FROM public.team_members a
WHERE a.ctid NOT IN (
    SELECT MIN(b.ctid)
    FROM public.team_members b
    WHERE a.team_id = b.team_id AND a.user_id = b.user_id
);

-- 2. Update the trigger function to handle duplicates properly
CREATE OR REPLACE FUNCTION public.create_default_channel()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a general channel for the new team
    INSERT INTO public.channels (team_id, name, description, created_by)
    VALUES (NEW.id, 'general', 'General discussion', NEW.created_by)
    ON CONFLICT (team_id, name) DO NOTHING;
    
    -- Add the team creator as owner in team_members (with proper conflict handling)
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (team_id, user_id) DO UPDATE SET
        role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Also, let's make sure the team creation doesn't try to add the member twice
-- We'll update the createTeam function to not manually add the member since the trigger does it
