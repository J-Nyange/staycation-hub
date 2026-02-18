

# Plan: Booking Payment Options, Messaging UX, and Security Hardening

## 1. Re-introduce "Pay Now" with Paystack + "Pay Later" Option in Booking Modal

**File: `src/components/BookingModal.tsx`**

Currently the booking form is "Request to Book" only (pay later). This will be restructured to offer two options:

### Changes:
- Add a `bookingMode` state: `'pay_now' | 'pay_later'` with a toggle/radio selector at the top of the form
- **Pay Now** flow:
  - Shows a tagline: "Save 5% when you pay instantly!"
  - Calculates `discountedPrice = totalPrice * 0.95` (5% off)
  - Shows both original and discounted prices with a strikethrough on the original
  - After form validation, creates booking with `payment_status: 'pending'` and `status: 'pending'`
  - Then shows PaystackPaymentForm (using existing component) to complete payment
  - On successful payment, booking status updates to `confirmed` via the existing `verify-paystack-payment` edge function
  - The modal hides behind the Paystack popup (using existing `onStart`/`onEnd` pattern)
- **Pay Later** flow (current behavior):
  - Keeps the existing "Request to Book" flow unchanged
  - `payment_status: 'awaiting_contact'`, owner contacts guest offline
- Price estimate section updated to show the discount when "Pay Now" is selected
- The `total_price` stored in the database for "Pay Now" will be the discounted amount

### New state variables:
- `bookingMode: 'pay_now' | 'pay_later'` (default: `'pay_now'`)
- `paymentStep: boolean` (to show Paystack form after booking creation)
- `createdBookingId: string | null`
- `modalHidden: boolean` (for Paystack popup overlay)

### UI layout for mode selector:
```text
Two cards side by side:
[Pay Now - Save 5%]    [Pay Later - Request to Book]
 "Instant confirmation"   "Owner contacts you"
```

---

## 2. Improve Messaging UX

### 2a. Fix user names showing as "User"

**File: `src/hooks/useMessages.ts`**

The current code fetches sender profiles from the `profiles` table. If a profile doesn't exist or has null names, it falls back to "User". Fix:
- When the profile lookup returns null names, fall back to the Clerk user's name from the conversation context
- Batch profile fetches instead of N+1 queries (fetch all unique sender IDs in one query)

**File: `src/components/messaging/MessageBubble.tsx`**
- For own messages, show "You" instead of the user's name (already only shows name for others)
- For other users, the name from the profile will now be correctly populated

**File: `src/hooks/useConversations.ts`**
- Already batch-fetches profiles, but the fallback is "User" when profiles have null names
- Add fallback to use Clerk user data when available (for own name display)

### 2b. Mobile-responsive messaging layout

**File: `src/pages/Messages.tsx`**

Current layout: `grid md:grid-cols-[350px_1fr]` -- on mobile both panels stack vertically which is poor UX.

Change to:
- On mobile: show conversation list OR message thread (not both), with a back button on the thread view
- On desktop: keep the current side-by-side layout
- Add state `showThread` to toggle between list and thread on mobile
- When a conversation is selected on mobile, hide the list and show the thread with a back arrow
- Use `useIsMobile()` hook (already exists in the project)

**File: `src/components/messaging/MessageThread.tsx`**
- Add optional `onBack` prop for mobile back navigation
- Show a header with back arrow + property title on mobile
- Reduce padding on mobile for more message space

**File: `src/components/messaging/MessageInput.tsx`**
- Make input area more compact on mobile (reduce min-height)
- Use a single-line input with send button on the same row for mobile

**File: `src/components/messaging/ConversationList.tsx`**
- Add header "Conversations" with message count
- Improve spacing for mobile touch targets

---

## 3. Security Hardening -- Hide Sensitive Data from Frontend

### 3a. Select only needed columns instead of `select('*')`

**Files to update with explicit column selections:**

| File | Table | Columns to select (exclude sensitive) |
|------|-------|--------------------------------------|
| `src/hooks/useProperties.ts` | properties | Exclude `commission_rate`, `owner_id` (for public queries) |
| `src/pages/PropertyDetails.tsx` | properties | Exclude `commission_rate` from public view |
| `src/hooks/useSearch.ts` | properties | Exclude `commission_rate` |
| `src/hooks/useAdvancedSearch.ts` | properties | Exclude `commission_rate` |
| `src/pages/Blog.tsx` | blog_posts | Exclude `author_id`, `moderation_status` |
| `src/components/BlogSection.tsx` | blog_posts | Exclude `author_id`, `moderation_status` |
| `src/pages/BlogPost.tsx` | blog_posts | Exclude `moderation_status` for public |

For properties, the public query will select:
```
id, title, description, location, price_per_night, guests, bedrooms, bathrooms, category, amenities, images, main_image, is_active, created_at, updated_at, cancellation_policy, latitude, longitude, property_type, instant_book, deposit_percentage, is_featured, group_booking_enabled, max_group_size, group_discount_percentage
```

### 3b. Remove console.log statements that leak data

**Search and remove** any `console.log` or `console.error` calls that output sensitive data (booking details, user IDs, payment info). Keep only generic error messages.

### 3c. Sanitize user-generated content

**File: `src/components/messaging/MessageBubble.tsx`**
- Content is already rendered as text (not HTML), which is safe
- Ensure no `dangerouslySetInnerHTML` is used anywhere for user content

**File: `src/pages/BlogPost.tsx`**
- Blog content uses `react-markdown` which is safe by default
- Verify no raw HTML rendering

### 3d. Input validation on message sending

**File: `src/hooks/useMessages.ts`**
- Add content length validation (max 2000 chars) before sending
- Trim whitespace

### 3e. Remove hardcoded test API keys from client code

**File: `src/components/PaystackPaymentForm.tsx`**
- The Paystack public key `pk_test_...` is hardcoded. While publishable keys are safe to expose, the test key should be replaced with the production key or loaded from an environment variable.

**File: `src/components/booking/BalancePaymentModal.tsx`**
- Same -- Stripe test key `pk_test_...` is hardcoded. Replace with production key or env var.

These are publishable keys so not a security risk, but using test keys in production will cause payments to fail. We should use `import.meta.env.VITE_PAYSTACK_PUBLIC_KEY` and `import.meta.env.VITE_STRIPE_PUBLIC_KEY` with production fallbacks.

---

## Summary of All File Changes

| File | Changes |
|------|---------|
| `src/components/BookingModal.tsx` | Add Pay Now/Pay Later toggle, 5% discount logic, Paystack integration |
| `src/components/PaystackPaymentForm.tsx` | Use env var for public key |
| `src/components/booking/BalancePaymentModal.tsx` | Use env var for Stripe public key |
| `src/pages/Messages.tsx` | Mobile-responsive layout with list/thread toggle |
| `src/components/messaging/MessageThread.tsx` | Add back button, mobile-optimized layout |
| `src/components/messaging/MessageInput.tsx` | Compact mobile input |
| `src/components/messaging/MessageBubble.tsx` | Better name display |
| `src/components/messaging/ConversationList.tsx` | Header, better mobile touch targets |
| `src/hooks/useMessages.ts` | Batch profile fetch, input validation, length limits |
| `src/hooks/useConversations.ts` | Better name fallbacks |
| `src/hooks/useProperties.ts` | Explicit column selection |
| `src/hooks/useSearch.ts` | Explicit column selection |
| `src/hooks/useAdvancedSearch.ts` | Explicit column selection |
| `src/pages/PropertyDetails.tsx` | Explicit column selection |
| `src/pages/Blog.tsx` | Explicit column selection |
| `src/components/BlogSection.tsx` | Explicit column selection |
| `src/pages/BlogPost.tsx` | Explicit column selection |

