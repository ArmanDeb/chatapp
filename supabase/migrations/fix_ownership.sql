-- Fix ownership for existing teams
-- Run this in Supabase Dashboard → SQL Editor

-- Add missing team owners (for teams where the creator is not in team_members)
INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, t.created_by, 'owner'
FROM public.teams t
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.team_members tm 
    WHERE tm.team_id = t.id 
    AND tm.user_id = t.created_by
)
ON CONFLICT (team_id, user_id) DO UPDATE SET
    role = 'owner';

-- Verify the results
SELECT 
    t.name as team_name,
    t.created_by,
    tm.user_id,
    tm.role,
    p.email,
    CASE 
        WHEN t.created_by = tm.user_id THEN 'CREATOR IS MEMBER ✅'
        ELSE 'CREATOR NOT MEMBER ❌'
    END as status
FROM public.teams t
LEFT JOIN public.team_members tm ON t.id = tm.team_id AND t.created_by = tm.user_id
LEFT JOIN public.profiles p ON tm.user_id = p.id
ORDER BY t.name;
