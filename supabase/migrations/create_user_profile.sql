-- Create profile for your specific user
-- Replace the UUID with your actual user ID from the debug info

-- Your user ID from the debug: 88c45704-4619-49ca-95d8-226232503a4
INSERT INTO public.profiles (id, email, display_name)
VALUES (
    '88c45704-4619-49ca-95d8-226232503a4'::uuid,
    'armandebongnie@gmail.com',
    'Arman'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name;

-- Verify the profile was created
SELECT * FROM public.profiles WHERE id = '88c45704-4619-49ca-95d8-226232503a4'::uuid;
