-- CRITICAL FIX: Properties table - allow ALL roles to read active properties
-- This policy must succeed for unauthenticated (anon), authenticated, and service_role users

-- 1. Drop ALL existing properties SELECT policies (including conflicting ones)
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Public can view active properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Anon can view properties" ON properties;
DROP POLICY IF EXISTS "Authenticated can view properties" ON properties;
DROP POLICY IF EXISTS "Allow public read access to active properties" ON properties;
DROP POLICY IF EXISTS "Enable read access" ON properties;
DROP POLICY IF EXISTS "SELECT properties" ON properties;

-- Create explicit policies for each role
CREATE POLICY "anonviewproperties"
ON properties FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "authviewproperties"
ON properties FOR SELECT  
TO authenticated
USING (is_active = true);

-- Also keep a catch-all for safety
CREATE POLICY "publicviewproperties"
ON properties FOR SELECT
USING (is_active = true);

-- 2. CRITICAL FIX: Blog posts table
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Anon can view blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can view blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow public read access to published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Enable read access" ON blog_posts;
DROP POLICY IF EXISTS "SELECT blog_posts" ON blog_posts;

CREATE POLICY "anonviewblogposts"
ON blog_posts FOR SELECT
TO anon
USING (is_published = true);

CREATE POLICY "authviewblogposts"
ON blog_posts FOR SELECT
TO authenticated
USING (is_published = true);

CREATE POLICY "publicviewblogposts"
ON blog_posts FOR SELECT
USING (is_published = true);

-- 3. CRITICAL FIX: Reviews table
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
DROP POLICY IF EXISTS "Anoncan view reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;
DROP POLICY IF EXISTS "Enable read access" ON reviews;
DROP POLICY IF EXISTS "SELECT reviews" ON reviews;

CREATE POLICY "anonviewreviews"
ON reviews FOR SELECT
TO anon
USING (true);

CREATE POLICY "authviewreviews"
ON reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "publicviewreviews"
ON reviews FOR SELECT
USING (true);
