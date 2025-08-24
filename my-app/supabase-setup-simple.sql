-- SIMPLE Supabase Database Setup for Opaque App
-- This version disables RLS temporarily to get things working

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
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

-- 2. DISABLE Row Level Security temporarily (we'll enable it later)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 5. Test insert (optional - remove this line after testing)
-- INSERT INTO public.users (id, username, email) VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test@test.com') ON CONFLICT DO NOTHING; 