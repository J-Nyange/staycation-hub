

# Plan: Fix Critical Database Security Issues

The security scan found **3 critical errors** and **2 warnings**. The most urgent: **RLS is completely disabled** on `blog_posts`, `properties`, and `reviews` tables, meaning all the carefully written policies on those tables have zero effect -- every row is publicly readable by anyone.

## Critical Findings

| Table | Issue | Severity |
|-------|-------|----------|
| `properties` | RLS disabled -- all 23 properties readable including inactive ones, commission rates, owner IDs | **Critical** |
| `blog_posts` | RLS disabled -- unpublished drafts, pending/rejected posts all publicly readable | **Critical** |
| `reviews` | RLS disabled -- policies not enforced (lower risk since reviews are public, but INSERT/UPDATE/DELETE unprotected) | **Warning** |
| Auth | Leaked password protection disabled | **Warning** |

## Fix: Single SQL Migration

Run one migration to enable RLS on all three tables:

```sql
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
```

The existing RLS policies on these tables are already correctly written with `auth.uid()::text` -- they just need RLS turned on to be enforced.

### What this fixes:
- **Properties**: Only `is_active = true` properties visible publicly; owners see their own; admins see all
- **Blog posts**: Only `is_published = true` posts visible publicly; authors see their drafts; admins see all
- **Reviews**: Public read stays open (policies use `USING (true)`), but INSERT/UPDATE/DELETE now require authentication

### Leaked Password Protection
This is a Supabase dashboard setting (Authentication > Settings) -- you should enable it manually to prevent users from signing up with known compromised passwords.

## No Code Changes Needed
All frontend code already works with these RLS policies. Enabling RLS simply activates the existing policy layer.

