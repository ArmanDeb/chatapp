-- Simple profile creation using current authenticated user
DO $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Get current user info from auth.users
    SELECT id, email INTO current_user_id, current_user_email
    FROM auth.users 
    WHERE email = 'armandebongnie@gmail.com';
    
    -- Insert profile if user found
    IF current_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, display_name)
        VALUES (current_user_id, current_user_email, 'Arman')
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = EXCLUDED.display_name;
            
        RAISE NOTICE 'Profile created for user: %', current_user_email;
    ELSE
        RAISE NOTICE 'User not found with email: armandebongnie@gmail.com';
    END IF;
END $$;

-- Verify the result
SELECT * FROM public.profiles WHERE email = 'armandebongnie@gmail.com';
