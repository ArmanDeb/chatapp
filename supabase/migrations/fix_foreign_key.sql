-- Fix foreign key constraint issue
-- Run this in Supabase Dashboard → SQL Editor

-- 1. First, let's make sure the current user has a profile
INSERT INTO public.profiles (id, email, display_name)
SELECT 
    auth.uid(), 
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    COALESCE(
        (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = auth.uid()),
        (SELECT email FROM auth.users WHERE id = auth.uid())
    )
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Drop the existing foreign key constraint on teams table
ALTER TABLE public.teams 
DROP CONSTRAINT IF EXISTS teams_created_by_fkey;

-- 3. Recreate the constraint to reference profiles instead of auth.users
ALTER TABLE public.teams 
ADD CONSTRAINT teams_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- 4. Do the same for channels table
ALTER TABLE public.channels 
DROP CONSTRAINT IF EXISTS channels_created_by_fkey;

ALTER TABLE public.channels 
ADD CONSTRAINT channels_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- 5. Update the trigger function to handle this properly
CREATE OR REPLACE FUNCTION public.create_default_channel()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the user has a profile first
    INSERT INTO public.profiles (id, email, display_name)
    SELECT 
        NEW.created_by,
        (SELECT email FROM auth.users WHERE id = NEW.created_by),
        COALESCE(
            (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = NEW.created_by),
            (SELECT email FROM auth.users WHERE id = NEW.created_by)
        )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create a general channel for the new team
    INSERT INTO public.channels (team_id, name, description, created_by)
    VALUES (NEW.id, 'general', 'General discussion', NEW.created_by);
    
    -- Add the team creator as owner in team_members
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Also update the user signup trigger to ensure profiles are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
