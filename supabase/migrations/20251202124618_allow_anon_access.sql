-- Fix RLS policies to allow anonymous (public) access to certain tables
-- This allows non-logged-in users to view properties and blog posts

-- Properties: Allow anyone to view active properties (not just authenticated users)
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;

CREATE POLICY "Anyone can view active properties"
ON properties FOR SELECT
TO anon, authenticated  -- Allow both anonymous and authenticated users
USING (is_active = true);

-- Blog posts: Allow anyone to view published blog posts
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

CREATE POLICY "Anyone can view published blog posts"
ON blog_posts FOR SELECT
TO anon, authenticated  -- Allow both anonymous and authenticated users
USING (is_published = true);

-- Reviews: Allow anyone to view reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;

CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO anon, authenticated  -- Allow both anonymous and authenticated users
USING (true);
