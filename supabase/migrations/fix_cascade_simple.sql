-- Fix the duplicate team member issue - NO TRUNCATE VERSION
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Delete data in correct order (respecting foreign keys)
DELETE FROM public.team_members;
DELETE FROM public.channels;
DELETE FROM public.teams;

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

-- 3. Verify tables are clean
SELECT COUNT(*) as teams_count FROM public.teams;
SELECT COUNT(*) as channels_count FROM public.channels;
SELECT COUNT(*) as team_members_count FROM public.team_members;
