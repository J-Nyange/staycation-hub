

# Plan: Remove Map View, Add Hero Images, Add Contact Page Map

## 1. Remove Map View Tab and Page

**Files to modify:**
- `src/components/Navbar.tsx` -- Remove the `{ name: "Map View", href: "/map" }` entry from the `navigation` array
- `src/App.tsx` -- Remove the `MapView` lazy import and the `<Route path="/map" ...>` route

**Files to delete:**
- `src/pages/MapView.tsx`
- `src/components/map/PropertyMap.tsx`
- `src/components/map/PropertyMarker.tsx`
- `src/components/map/MapControls.tsx`

The edge function `geocode-properties` and the geocoding utils will be kept since they are still used by AddPropertyModal and EditPropertyModal.

---

## 2. Add Hero Background Images to All Pages

Each page currently has a plain gradient hero section. These will be converted to use a full-width background image with a dark overlay (like the homepage Hero component), with white text on top.

Since the project already has 3 images in `src/assets/`, they will be matched to the most relevant pages. For pages without a matching local image, high-quality Unsplash URLs will be used (already used elsewhere in the project, e.g., About page).

**Image assignments:**
| Page | Image | Rationale |
|------|-------|-----------|
| Airbnb | `src/assets/airbnb-interior.jpg` | Local asset, matches apartment theme |
| Villas | `src/assets/hero-villa.jpg` | Local asset, matches luxury villa theme |
| Homestays | `src/assets/homestay-cottage.jpg` | Local asset, matches homestay theme |
| Blog | Unsplash travel/beach photo | Travel stories theme |
| About | Unsplash Kenya coastline photo | Company/brand story |
| Contact | Unsplash customer service / coastal office photo | Support/contact theme |

**Pattern for each hero section** (matching the homepage Hero style):

```text
<section className="relative py-24 lg:py-32 overflow-hidden">
  <div className="absolute inset-0 z-0">
    <img src={heroImage} alt="..." className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/50" />
  </div>
  <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
    <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-white">
      ...
      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        ...
      </span>
    </h1>
    <p className="text-lg text-white/90 max-w-2xl mx-auto">...</p>
    <!-- badges/tags also updated to white text -->
  </div>
</section>
```

**Files to modify:**
- `src/pages/Airbnb.tsx`
- `src/pages/Villas.tsx`
- `src/pages/Homestays.tsx`
- `src/pages/Blog.tsx`
- `src/pages/About.tsx`
- `src/pages/Contacts.tsx`

---

## 3. Add Real Leaflet Map to Contact Page

Replace the "Interactive Map Coming Soon" placeholder in `src/pages/Contacts.tsx` with a real Leaflet map pinned to coordinates **-3.3803987215311975, 38.57530888460797**.

The project already has `react-leaflet`, `leaflet`, and `@types/leaflet` installed, plus Leaflet CSS is already imported in the map components. The contact map will be a simple, self-contained usage:

```text
<MapContainer
  center={[-3.3803987215311975, 38.57530888460797]}
  zoom={15}
  className="h-64 w-full rounded-2xl z-0"
  scrollWheelZoom={false}
>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[-3.3803987215311975, 38.57530888460797]}>
    <Popup>Lukemanbnb - Nyali Beach, Mombasa</Popup>
  </Marker>
</MapContainer>
```

A Leaflet default icon fix (already known pattern from the codebase) will be included to ensure the marker pin renders correctly.

**File to modify:** `src/pages/Contacts.tsx`

---

## Summary of All Changes

| File | Action |
|------|--------|
| `src/components/Navbar.tsx` | Remove "Map View" from navigation |
| `src/App.tsx` | Remove MapView route and import |
| `src/pages/MapView.tsx` | Delete |
| `src/components/map/PropertyMap.tsx` | Delete |
| `src/components/map/PropertyMarker.tsx` | Delete |
| `src/components/map/MapControls.tsx` | Delete |
| `src/pages/Airbnb.tsx` | Add hero background image |
| `src/pages/Villas.tsx` | Add hero background image |
| `src/pages/Homestays.tsx` | Add hero background image |
| `src/pages/Blog.tsx` | Add hero background image |
| `src/pages/About.tsx` | Add hero background image |
| `src/pages/Contacts.tsx` | Add hero background image + replace map placeholder with real Leaflet map |

