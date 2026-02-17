

# Update Clerk to Production Key

## Change

**File: `src/App.tsx` (line 50)**

Replace the current line:
```
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
```

With:
```
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_live_Y2xlcmsubHVrZW1hbmJuYi5jb20k";
```

This hardcodes the production publishable key as a fallback, following the same hybrid pattern used previously with the development key.

## Reminders

- Ensure your **Clerk production instance** has the `supabase` JWT template configured with the same claims (`sub`, `aud`, `role`, `email`, `user_metadata`) as your development instance.
- Update your **Supabase JWT secret** (Supabase Dashboard > Settings > API > JWT Settings) to match the Clerk production instance's JWT signing key.

