-- Extended Supabase Database Setup for Opaque App
-- This includes tables for connections and notifications

-- 1. Drop existing tables if they exist
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.connection_requests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create the users table
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

-- 3. Create connection requests table
CREATE TABLE public.connection_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- 4. Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_skills ON public.users USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_users_domains ON public.users USING GIN(domains);

CREATE INDEX IF NOT EXISTS idx_connection_requests_from_user ON public.connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_to_user ON public.connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON public.connection_requests(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 6. IMPORTANT: DISABLE Row Level Security completely for now
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 7. Grant ALL permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO anon;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connection_requests_updated_at BEFORE UPDATE ON public.connection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert some sample data for testing
INSERT INTO public.users (id, username, email, tagline, skills, domains, availability) VALUES
    ('00000000-0000-0000-0000-000000000001', 'alex_johnson', 'alex@example.com', 'Full-stack Developer | AI/ML Enthusiast | Hackathon Winner', ARRAY['React', 'Node.js', 'Python', 'TensorFlow', 'UI/UX Design', 'Cloud Computing', 'Project Management'], ARRAY['AI', 'HealthTech', 'Sustainability'], 'Weekends and evenings'),
    ('00000000-0000-0000-0000-000000000002', 'maria_garcia', 'maria@example.com', 'Team Lead & Backend Developer', ARRAY['Python', 'Django', 'PostgreSQL', 'AWS', 'Team Management'], ARRAY['AI', 'FinTech'], 'Flexible schedule'),
    ('00000000-0000-0000-0000-000000000003', 'david_lee', 'david@example.com', 'UI/UX Designer & Frontend Developer', ARRAY['Figma', 'React', 'CSS', 'User Research', 'Prototyping'], ARRAY['Sustainability', 'HealthTech'], 'Available most days');

-- 10. Verify the tables were created
SELECT 'Tables created successfully!' as status;
SELECT 'Users table:' as table_name, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 'Connection requests table:' as table_name, COUNT(*) as record_count FROM public.connection_requests
UNION ALL
SELECT 'Notifications table:' as table_name, COUNT(*) as record_count FROM public.notifications; 