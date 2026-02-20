-- EMERGENCY: Disable RLS temporarily to restore service
-- This is a production emergency fix - use only if the policy approach fails
-- WARNING: This removes Row Level Security - use TEMPORARILY while troubleshooting

ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- You can re-enable with:
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
