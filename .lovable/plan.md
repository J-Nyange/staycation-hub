
# Plan: Migrate from Clerk to Supabase Authentication

## Why Your Current Setup Is Broken

Your RLS policies use `(auth.jwt()->>'sub')::text` to identify users. With Clerk development keys, Clerk issued JWTs that Supabase could validate using a shared JWT secret. When you switched to production keys, the JWT signing key changed, causing Supabase to reject the tokens -- so authenticated users see nothing because every RLS check fails.

## Migration Overview

This is a large migration touching **38+ files**. All user IDs in your database are Clerk format (`user_35wA9...`) stored as `text`. Supabase Auth uses UUIDs. Since you have relatively few records (3 profiles, 5 bookings, 23 properties), the safest approach is:

1. Keep `user_id` columns as `text` type (avoids schema breakage)
2. Store Supabase Auth UUIDs as text (e.g., `auth.uid()::text`)
3. Update all RLS policies to use `auth.uid()::text` instead of `(auth.jwt()->>'sub')::text`
4. Replace Clerk components/hooks with Supabase Auth equivalents throughout the frontend

**Will there be errors?** The migration itself is straightforward, but:
- Existing user data (profiles, bookings, properties) is tied to Clerk user IDs. New Supabase Auth users will get new UUIDs, so existing data won't auto-link. You'll need to manually update the `user_id`/`owner_id` values for your existing users after they sign up via Supabase Auth.
- Google/social sign-in requires configuration in your Supabase dashboard.

---

## Step 1: Database Migration (SQL)

### 1a. Update all RLS policies to use `auth.uid()::text`

Replace every `(auth.jwt()->>'sub')::text` with `auth.uid()::text` across all tables:
- `profiles`, `bookings`, `properties`, `reviews`, `wishlists`, `notifications`, `conversations`, `messages`, `blog_posts`, `booking_modifications`, `user_roles`, `push_subscriptions`, `support_conversations`, `support_messages`, `legal_agreements`, `sms_logs`, `blocked_dates`, `seasonal_pricing`

### 1b. Update security definer functions

```sql
-- Update has_role to accept text (keep as-is, just change callers)
CREATE OR REPLACE FUNCTION public.has_role(_user_id text, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid()::text, 'admin')
$$;
```

### 1c. Update trigger functions

All trigger functions that reference user identity (`notify_new_booking`, `notify_booking_status_change`, etc.) don't use `auth.jwt()` directly -- they reference table columns, so they'll continue working.

### 1d. Create profile auto-creation trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Step 2: Supabase Client Update

**File: `src/integrations/supabase/client.ts`**

Replace the entire custom Clerk token-provider setup with a standard Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aermicluavoxxxhkajah.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGci...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

Remove the `setTokenProvider` export and all token sync logic.

---

## Step 3: Create Auth Context

**New file: `src/contexts/AuthContext.tsx`**

Create a React context that replaces all Clerk hooks (`useUser`, `useAuth`, `useClerk`):

```typescript
// Provides: user, session, isLoaded, isSignedIn, signOut
// Listens to supabase.auth.onAuthStateChange
// Exposes signInWithOAuth, signInWithPassword, signUp, resetPassword
```

This context wraps the app and provides:
- `user` (equivalent to Clerk's `useUser().user`) with `id`, `email`, `firstName`, `imageUrl`, etc.
- `isSignedIn`, `isLoaded` booleans
- `signOut()`, `signInWithOAuth()`, `signInWithPassword()`, `signUp()`

---

## Step 4: Create Auth UI Components

**New file: `src/components/auth/AuthModal.tsx`**

A dialog-based auth modal with tabs for Sign In / Sign Up, replacing Clerk's `<SignInButton>` and `<SignUpButton>`:
- Email + password sign in/up
- Google sign-in button (via `supabase.auth.signInWithOAuth({ provider: 'google' })`)
- Password reset flow
- Clean, branded UI matching the existing design

**New file: `src/pages/ResetPassword.tsx`**

Required page for password reset flow -- users land here after clicking the email link.

---

## Step 5: Update App.tsx

- Remove `ClerkProvider`, `SupabaseTokenSync`, and all Clerk imports
- Wrap app with `AuthProvider` from the new context
- Add `/reset-password` route
- Remove the hardcoded Clerk publishable key

---

## Step 6: Update All 38 Files Using Clerk

Every file that imports from `@clerk/clerk-react` needs to be updated:

| What to replace | With |
|----------------|------|
| `import { useUser } from '@clerk/clerk-react'` | `import { useAuth } from '@/contexts/AuthContext'` |
| `const { user } = useUser()` | `const { user } = useAuth()` |
| `user.id` | `user.id` (now a UUID string) |
| `user.firstName` | `user.firstName` (mapped from Supabase user metadata) |
| `user.imageUrl` | `user.avatarUrl` (from user metadata or profile) |
| `useClerk().signOut()` | `useAuth().signOut()` |
| `<SignInButton>` | `<AuthModal>` trigger |
| `<SignUpButton>` | `<AuthModal>` trigger |
| `useAuth().isSignedIn` | `useAuth().isSignedIn` |
| `useAuth().userId` | `useAuth().user?.id` |
| `useAuth().getToken()` | Remove (Supabase handles tokens internally) |

**Files to update** (all 38):
`Navbar.tsx`, `AdminGuard.tsx`, `BookingModal.tsx`, `PropertyCard.tsx`, `AddPropertyModal.tsx`, `ReviewForm.tsx`, `NotificationSettings.tsx`, `BookingNotificationModal.tsx`, `ResumePaymentModal.tsx`, `TransferOwnershipModal.tsx`, `Profile.tsx`, `Messages.tsx`, `OwnerDashboard.tsx`, `OwnerBookings.tsx`, `BookingHistory.tsx`, `BookingConfirmation.tsx`, `MyProperties.tsx`, `MyBlogPosts.tsx`, `CreateBlogPost.tsx`, `EditBlogPost.tsx`, `Notifications.tsx`, `Wishlist.tsx`, `PropertyDetails.tsx`, `useUserProfile.ts`, `useUserRole.ts`, `useMessages.ts`, `useConversations.ts`, `useNotifications.ts`, `useWishlist.ts`, `useOwnerAnalytics.ts`, `usePushNotifications.ts`, `useRealtimeNotifications.ts`, `useReviews.ts`, `useBookingNotificationDetails.ts`, `useSearch.ts`, `useAdminData.ts`, `App.tsx`

---

## Step 7: Update Edge Functions

Two edge functions manually decode Clerk JWTs (`atob(token.split('.')[1])` to get `payload.sub`):

- `supabase/functions/send-booking-emails/index.ts`
- `supabase/functions/notify-owner-booking-request/index.ts`

These will be updated to use Supabase's built-in auth:
```typescript
const supabaseClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await supabaseClient.auth.getUser();
const userId = user?.id;
```

Two other edge functions already use `supabaseClient.auth.getClaims()`:
- `send-push-notification/index.ts`
- `send-sms/index.ts`

These will also be updated to use `getUser()` for consistency.

---

## Step 8: Post-Migration Setup (Manual Steps for You)

1. **Enable Google OAuth**: Go to Supabase Dashboard > Authentication > Providers > Google, and add your Google OAuth client ID and secret
2. **Set Redirect URLs**: In Supabase Dashboard > Authentication > URL Configuration:
   - Site URL: `https://lukemanbnb.com`
   - Redirect URLs: `https://lukemanbnb.com/**`
3. **Re-link existing data**: After your admin user signs up via Supabase Auth, run a SQL update to map the old Clerk user ID to the new Supabase UUID:
   ```sql
   -- Example: UPDATE profiles SET user_id = 'new-supabase-uuid' WHERE user_id = 'user_35wA9egXXsSfcza1TUROhHcVl8q';
   -- Repeat for properties.owner_id, bookings.user_id, etc.
   ```

---

## Summary

| Area | Changes |
|------|---------|
| Database | ~40 RLS policy updates, 2 function updates, 1 new trigger |
| Frontend | 38 files: replace Clerk imports with Supabase Auth context |
| New files | `AuthContext.tsx`, `AuthModal.tsx`, `ResetPassword.tsx` |
| Edge functions | 4 functions updated for Supabase auth |
| Removed deps | `@clerk/clerk-react` (can be uninstalled after) |
| Manual config | Google OAuth setup in Supabase dashboard, redirect URLs, data re-linking |
