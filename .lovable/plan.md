

# Fix: Geocode Properties Via Edge Function

## Problem

All 23 properties have `null` coordinates. The current client-side geocoding in `MapView.tsx` fails silently because:

- The Supabase client uses the anon key (or a non-owner Clerk token)
- RLS policies only allow property **owners** to update their own properties
- So `supabase.from('properties').update(...)` is rejected for every property

The `AddPropertyModal` and `EditPropertyModal` geocoding works correctly because the owner is authenticated when creating/editing their own property. But the **backfill** for existing properties needs elevated permissions.

## Solution

Create a small edge function (`geocode-properties`) that runs with the service role key (bypasses RLS) to batch-geocode all properties missing coordinates. Then call it once from MapView instead of trying client-side updates.

### Step 1: Create Edge Function `geocode-properties`

**File: `supabase/functions/geocode-properties/index.ts`**

- Accepts a POST request (no auth required since it only fills missing data)
- Queries properties where `latitude IS NULL AND longitude IS NULL AND location IS NOT NULL`
- For each, calls Nominatim geocoding API with 1.1s delay between requests
- Updates the property row using the service role client (bypasses RLS)
- Returns a summary of how many were geocoded

### Step 2: Simplify `MapView.tsx` Backfill

Replace the current client-side geocoding `useEffect` with a single edge function call:

```
useEffect(() => {
  if (!properties || geocodedRef.current) return;
  const missing = properties.filter(p => !p.latitude && !p.longitude && p.location);
  if (missing.length === 0) return;
  geocodedRef.current = true;

  supabase.functions.invoke('geocode-properties').then(() => {
    // Refetch properties after geocoding
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  });
}, [properties]);
```

This avoids the `window.location.reload()` and instead uses React Query's cache invalidation for a smoother experience.

### Step 3: Keep AddPropertyModal/EditPropertyModal As-Is

The existing client-side geocoding in these modals works correctly because the authenticated owner has RLS permission to update their own properties. No changes needed.

---

## Files to create/modify:

1. **`supabase/functions/geocode-properties/index.ts`** (new) -- Edge function for batch geocoding with service role
2. **`src/pages/MapView.tsx`** -- Replace client-side geocoding with edge function call, remove `window.location.reload()`

