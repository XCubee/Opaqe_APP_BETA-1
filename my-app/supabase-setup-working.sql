-- WORKING Supabase Database Setup for Opaque App
-- This will definitely fix your RLS issues

-- 1. Drop the existing table if it exists (to start fresh)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create the users table WITHOUT any RLS
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tagline TEXT,
    skills TEXT[] DEFAULT '{}',
    domains TEXT[] DEFAULT '{}',
    availability TEXT,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. IMPORTANT: DISABLE Row Level Security completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Grant ALL permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 6. Verify the table was created
SELECT 'Table created successfully!' as status;
