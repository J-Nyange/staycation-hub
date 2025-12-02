-- Fix permissions to allow anonymous (public) access
-- RLS policies are not enough; users also need table-level SELECT permissions

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on public tables to anon and authenticated roles
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated; -- Needed to view owner profiles
