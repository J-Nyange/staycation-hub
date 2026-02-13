
# Production Readiness Audit - Comprehensive Fix Plan

## Issues Found

### 1. CRITICAL: Database Constraint Violations

**A. `bookings.status` constraint only allows: `pending`, `confirmed`, `cancelled`, `completed`**
- The `expire-pending-bookings` edge function sets `status: 'expired'` -- this will FAIL
- The `stripe-webhook` sets `status: 'failed'` and `status: 'refunded'` -- these will FAIL
- **Fix:** Add a migration to expand the status constraint to include `expired`, `failed`, `refunded`

**B. `bookings.payment_status` constraint only allows: `pending`, `paid`, `refunded`, `failed`, `awaiting_contact`**
- `OwnerBookings.tsx` line 107 sets `payment_status: 'paid_offline'` -- this will FAIL
- `OwnerBookings.tsx` line 134 sets `payment_status: 'cancelled'` -- this will FAIL
- **Fix:** Either add `paid_offline` and `cancelled` to the constraint, OR change the code to use existing valid values

**C. `bookings.cancelled_by` column is type `uuid` but Clerk user IDs are strings (not UUIDs)**
- `cancel-booking` edge function sets `cancelled_by: user.id` where `user.id` is a Clerk string ID like `user_abc123`
- This will cause a type mismatch error
- **Fix:** Alter `cancelled_by` column from `uuid` to `text`

### 2. CRITICAL: OwnerBookings.tsx Uses `supabase.auth.getUser()` Instead of Clerk

Lines 39 and 61 in `OwnerBookings.tsx` call `await supabase.auth.getUser()` which will always return null because auth is handled by Clerk, not Supabase Auth. This means:
- The owner bookings page will NEVER load data
- The modifications query will NEVER work
- **Fix:** Replace `supabase.auth.getUser()` with the Clerk `user` object already available via the `useUser()` hook

### 3. CRITICAL: `send-booking-emails` Uses `auth.getClaims()` and `auth.admin.getUserById()`

- `supabase.auth.getClaims(token)` is not a valid Supabase JS method -- this will throw an error
- `supabase.auth.admin.getUserById(booking.user_id)` will fail because `user_id` is a Clerk ID, not a Supabase Auth user ID
- Same issue in `notify-owner-booking-request` function
- **Fix:** For JWT-verified functions, decode the Clerk JWT `sub` claim directly. For getting user emails, query the `profiles` table (and add an `email` column to profiles if needed) or get email from the booking record's `guest_email` field

### 4. CRITICAL: `notify-owner-booking-request` Uses `auth.getClaims()` 

Same issue as above -- `auth.getClaims()` is not a valid method. This function will fail silently when a guest submits a booking request, meaning owners will NOT get notified.

- **Fix:** Decode JWT manually to get user ID from the `sub` claim, and use booking/profile data instead of `auth.admin.getUserById()`

### 5. IMPORTANT: Notifications Table - DELETE Policy Missing

The `useNotifications` hook (line 29) tries to delete old notifications:
```js
await supabase.from('notifications').delete().lt('created_at', cutoff).eq('user_id', user.id);
```
But the notifications table has NO DELETE policy for users. This silently fails every time.

- **Fix:** Add an RLS policy allowing users to delete their own notifications

### 6. IMPORTANT: Notifications Table - INSERT Policy Missing

The `notify_new_booking`, `notify_booking_status_change`, `notify_new_review`, and `notify_new_message` database trigger functions insert into `notifications`, but they run as `SECURITY DEFINER` so they bypass RLS. However, there's no INSERT policy at all, which means any client-side inserts will fail. The current code only inserts via edge functions using service role (which bypasses RLS), so this is acceptable but should be noted.

### 7. MODERATE: `send-notification-email` Function is Incomplete

This function only logs notifications but doesn't actually send emails (the Resend call is commented out). This is a stub function.

- **Fix:** Either implement it fully or remove it to avoid confusion

### 8. MODERATE: `send-push-notification` Doesn't Actually Send Push Notifications

Line 127: `console.log("Would send push to:", subscription.endpoint)` -- it just logs instead of actually sending. Missing VAPID key configuration.

- **Fix:** Note for production that this needs VAPID keys configured, or mark as not yet implemented

### 9. MODERATE: `profiles` Table Has No `email` Column

Several functions try to get owner email from profiles (`ownerProfile?.email` in `notify-owner-booking-request` line 162), but profiles doesn't have an email column. Owner notification emails will never be sent.

- **Fix:** Add `email` column to profiles, or populate it during profile creation from Clerk data

### 10. MINOR: `payment_transactions.booking_id` Can Be Null

The `stripe-webhook` inserts payment transactions for failed payments without a `booking_id` (line 123-130), which is fine. But the schema shows `booking_id` is nullable, which is correct.

### 11. MINOR: `bookings_user_id_fkey` Foreign Key Reference

`OwnerBookings.tsx` line 48 references `profiles!bookings_user_id_fkey` -- this assumes a foreign key from `bookings.user_id` to `profiles`. Since `bookings.user_id` is `text` (Clerk ID) and profiles uses `user_id` (text), this foreign key may not exist. This join will fail.

- **Fix:** Use a separate query to fetch guest profiles, similar to how `useConversations` does it

---

## Implementation Plan

### Step 1: Database Migration
Add a migration to:
- Expand `bookings_status_check` to include `expired`, `failed`, `refunded`
- Expand `bookings_payment_status_check` to include `paid_offline`
- Change `cancelled_by` column from `uuid` to `text`
- Add `email` column to `profiles` table
- Add DELETE policy on `notifications` for users to delete their own notifications

### Step 2: Fix OwnerBookings.tsx
- Replace `supabase.auth.getUser()` calls with Clerk's `user` object
- Fix the profile join query to use a separate profile fetch instead of FK join
- Change `payment_status: 'cancelled'` to `payment_status: 'failed'` (valid constraint value)

### Step 3: Fix `send-booking-emails` Edge Function
- Remove `auth.getClaims()` -- decode JWT manually using the `sub` claim
- Replace `auth.admin.getUserById()` calls with profile table queries
- Use `guest_email` from booking record for guest emails
- Use new `email` column from profiles for owner emails

### Step 4: Fix `notify-owner-booking-request` Edge Function
- Remove `auth.getClaims()` -- decode JWT manually
- Replace `auth.admin.getUserById()` with profile table query for owner email
- Use booking record for guest contact info (already partially done)

### Step 5: Fix `BookingNotificationModal.tsx` Confirm Action
- Currently `handleConfirmBooking` sets `payment_status: 'awaiting_contact'` which doesn't change anything meaningful
- Should probably set `payment_status: 'paid_offline'` (now valid after migration)

### Step 6: Update `useUserProfile.ts` to Save Email
- When creating a new profile, also save the user's email from Clerk

### Step 7: Fix `send-notification-email` (Optional)
- Either implement the actual email sending or add a clear comment that it's a scheduled job stub

### Technical Details

**JWT Decoding for Edge Functions (replacing `auth.getClaims()`):**
```typescript
// Decode JWT to get Clerk user ID
const token = authHeader.replace("Bearer ", "");
const payload = JSON.parse(atob(token.split('.')[1]));
const userId = payload.sub;
```

**Migration SQL:**
```sql
-- Expand status constraint
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending','confirmed','cancelled','completed','expired','failed','refunded'));

-- Expand payment_status constraint  
ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending','paid','refunded','failed','awaiting_contact','paid_offline'));

-- Fix cancelled_by column type
ALTER TABLE bookings ALTER COLUMN cancelled_by TYPE text USING cancelled_by::text;

-- Add email to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING ((auth.jwt()->>'sub')::text = user_id);
```

**Files to modify:**
1. New migration SQL (database changes)
2. `src/pages/OwnerBookings.tsx` (fix auth + queries + constraint values)
3. `supabase/functions/send-booking-emails/index.ts` (fix auth + user lookups)
4. `supabase/functions/notify-owner-booking-request/index.ts` (fix auth + user lookups)
5. `src/hooks/useUserProfile.ts` (save email on profile creation)
6. `src/components/notifications/BookingNotificationModal.tsx` (fix confirm action payment_status)
