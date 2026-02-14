

# Fix Plan: Chat UUID Error, Dashboard Metrics, Mobile Optimization, and Other Errors

## Issue 1: Chat "invalid syntax for type uuid" Error

**Root Cause:** The `notify_new_message` database trigger function declares `recipient_id` as `UUID`, but `conversations.guest_id` and `conversations.owner_id` are `text` (Clerk string IDs like `user_abc123`). When a message is inserted, the trigger tries to assign a text value into a UUID variable, causing the error.

**Fix:** Create a database migration to replace the trigger function, changing `DECLARE recipient_id UUID` to `DECLARE recipient_id TEXT`.

```text
Migration SQL:
  CREATE OR REPLACE FUNCTION public.notify_new_message()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
  AS $function$
  DECLARE
    recipient_id TEXT;  -- Changed from UUID to TEXT
  BEGIN
    SELECT CASE 
      WHEN NEW.sender_id = c.guest_id THEN c.owner_id
      ELSE c.guest_id
    END INTO recipient_id
    FROM conversations c
    WHERE c.id = NEW.conversation_id;
    
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      recipient_id, 'message', 'New Message', 'You have a new message',
      '/messages',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    );
    RETURN NEW;
  END;
  $function$;
```

---

## Issue 2: Owner Dashboard Metrics Don't Change With Time Range

**Root Cause:** The `get_owner_analytics` database function does NOT accept any date parameters. It always returns all-time data. The summary metrics (Total Revenue, Total Bookings, Avg Booking Value, etc.) are computed from this all-time data, so changing the time range selector only affects the revenue chart (which uses `get_revenue_by_month` with date params) but NOT the metric cards.

**Fix (two parts):**

**A. Update the database function** to accept `start_date` and `end_date` parameters and filter bookings accordingly:

```text
CREATE OR REPLACE FUNCTION public.get_owner_analytics(
  target_owner_id text,
  start_date date DEFAULT '2020-01-01',
  end_date date DEFAULT CURRENT_DATE
)
  -- Same return type
  -- Add: AND b.created_at::date >= start_date AND b.created_at::date <= end_date
  -- to the LEFT JOIN or WHERE clause for bookings
```

**B. Update `src/hooks/useOwnerAnalytics.ts`** to pass date range parameters to the RPC call:

```text
const { start, end } = getDateRange(timeRange);
const { data, error } = await supabase.rpc("get_owner_analytics", {
  target_owner_id: user.id,
  start_date: start,
  end_date: end,
});
```

---

## Issue 3: Mobile Optimization for Faster Loading

**Changes:**

**A. Lazy-load route pages** in `src/App.tsx`:
- Use `React.lazy()` and `Suspense` for all page components instead of eager imports
- This reduces the initial JavaScript bundle significantly since pages are only loaded when navigated to

**B. Add `loading="lazy"` to the hero image** in `src/components/Hero.tsx`:
- The hero background image is large; adding lazy loading attributes helps on mobile

**C. Optimize `FeaturedProperties`** in `src/components/FeaturedProperties.tsx`:
- Add `loading="lazy"` to property card images
- Reduce initial skeleton count on mobile from 6 to 3

**D. Add `fetchpriority` hints**: Mark the hero image as `fetchpriority="high"` and other below-fold images as `loading="lazy"`

---

## Issue 4: Other Errors Found

**A. `LiveChatWidget` support chat** (`src/components/support/LiveChatWidget.tsx`):
- Uses `ScrollArea` with a `ref` prop, but `ScrollArea` from shadcn/radix does not forward refs to a scrollable div properly. This may prevent auto-scroll to bottom from working. Same issue exists in `MessageThread.tsx`.
- Fix: Use a wrapper `<div ref={scrollRef}>` inside ScrollArea instead of passing ref to ScrollArea.

**B. `useConversations.ts` N+1 query pattern**:
- For every conversation, it makes 3 separate DB queries (last message, unread count, other user profile). With many conversations this becomes very slow.
- Fix: Batch the profile lookups into a single query using `.in('user_id', [...ids])`.

---

## Implementation Summary

### Files to modify:
1. **Database migration** -- Fix `notify_new_message` function (UUID to TEXT) and update `get_owner_analytics` to accept date params
2. **`src/hooks/useOwnerAnalytics.ts`** -- Pass date range to `get_owner_analytics` RPC
3. **`src/App.tsx`** -- Lazy-load all route pages with `React.lazy` + `Suspense`
4. **`src/components/Hero.tsx`** -- Add `fetchpriority="high"` to hero image
5. **`src/components/messaging/MessageThread.tsx`** -- Fix ScrollArea ref for auto-scroll
6. **`src/components/support/LiveChatWidget.tsx`** -- Fix ScrollArea ref for auto-scroll
7. **`src/hooks/useConversations.ts`** -- Batch profile lookups to reduce queries

### Estimated scope: 7 file changes + 1 database migration

