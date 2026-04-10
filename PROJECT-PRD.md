# PRD: True Size Map

## Overview

A React web application that visualizes the true geographic size of countries by overlaying them on a Mercator projection Google Map. Users can search for countries, place them on the map, drag them around to compare sizes at different latitudes, and have multiple countries active simultaneously.

---

## Background & Motivation

Mercator maps famously distort country sizes — Greenland appears larger than Africa, yet Africa is ~14x bigger in reality. This tool makes that distortion visceral and interactive. As a country is dragged across latitudes, it dynamically recalculates and redraws its true shape at that position on the Mercator projection, giving users an intuitive sense of real geographic scale.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18+ (Vite) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (latest) |
| Map | Google Maps JavaScript API (`@vis.gl/react-google-maps` latest) |
| GeoJSON | Natural Earth / world-atlas dataset |
| Projections | `d3-geo` for Mercator math |
| State | Zustand or React context |
| Language | TypeScript |

---

## Core Concepts

### True Size Rendering

On a Mercator projection, the same polygon drawn at different latitudes appears at different sizes due to the cos(lat) scale factor. To show a country at its *true size*:

1. Load the country's GeoJSON at its real centroid.
2. Project it using `d3-geo` with a Mercator projection centered at the map's current viewport.
3. Reproject it centered at the user's chosen latitude (where they dragged it).
4. Render the reprojected polygon as a Google Maps `Polygon` overlay.

When a country is dragged north or south, its rendered shape stretches/shrinks in real-time to reflect true Mercator distortion at that latitude.

---

## Features

### F1 — Full-Screen Grayscale Map

- Google Map fills 100% of the viewport.
- Custom map style: grayscale / muted theme (use Google Maps `styles` array or Cloud-based map ID).
- Standard zoom and pan controls enabled (scroll wheel, pinch, drag).
- No default POI labels or transit overlays — clean basemap only.

**Acceptance Criteria:**
- Map renders full-screen on all viewport sizes.
- Map is visually grayscale.
- Zoom (scroll/pinch) and pan (drag) work as expected.

---

### F2 — Country Search Input with Autocomplete

**UI Layout:**
- Fixed card in the upper-left corner, overlaying the map (`position: absolute`, z-index above map).
- Card contains:
  - A text input field with placeholder `"Search for a country…"`
  - A dropdown autocomplete list that appears while typing.

**Autocomplete Behavior:**
- Matches country names case-insensitively, substring match.
- Dropdown shows up to 8 results.
- Each row in the dropdown: `[flag emoji] Country Name`.
- Keyboard navigable (↑ ↓ Enter Escape).
- Selecting a country from the dropdown adds it to the map (see F3) and clears the input.

**Data:**
- Use a static list of ~250 countries/territories with:
  - `name: string`
  - `code: string` (ISO 3166-1 alpha-2, used to derive flag emoji: `🇺🇸` etc.)
  - `geojson: Feature<Polygon | MultiPolygon>` (loaded from bundled dataset)

**Acceptance Criteria:**
- Typing partial country names shows matching suggestions with flags.
- Selecting a suggestion adds the country to the map.
- Input is cleared after selection.
- Dropdown closes on Escape or outside click.

---

### F3 — Country Overlay on Map

When a country is selected:

1. Compute the country's true-size polygon projected at its real-world centroid latitude on the current map view.
2. Assign a random color from a predefined accessible palette (e.g. `["#E63946", "#2A9D8F", "#E9C46A", "#F4A261", "#A8DADC", "#457B9D"]`).
3. Render a Google Maps `Polygon` overlay with:
   - `strokeColor`: the assigned color, `strokeWeight: 2`
   - `fillColor`: the assigned color, `fillOpacity: 0.35`
4. The polygon is interactive: hoverable (cursor changes) and draggable.

**Active State:**
- Clicking a country polygon on the map makes it "active."
- Only one country is active at a time (most recently clicked).
- Active country's stroke weight increases to 3 and a subtle glow effect is shown.

**Acceptance Criteria:**
- Each selected country renders with a unique random color.
- Fill is semi-transparent (35% opacity).
- Stroke is solid.
- Clicking a country makes it active.

---

### F4 — Drag to Show True Size

**Behavior:**
- The user can click and drag any country polygon across the map.
- While dragging, the polygon is continuously recomputed:
  - The country's canonical GeoJSON is reprojected in Mercator, centered at the drag target's latitude.
  - This means the shape stretches vertically as it moves toward the poles and compresses as it moves toward the equator.
- The polygon smoothly updates position and shape during drag.
- On drag end, the final position and shape are committed.

**Technical Notes:**
- Use `d3-geo` `geoMercator()` projection:
  - Scale the projection so that 1 degree = the pixel-per-degree ratio of the current Google Maps zoom.
  - Translate to the centroid of the drag target.
  - Convert projected pixel coords back to lat/lng for Google Maps `Polygon` paths.
- The reprojection must happen on every `mousemove` / `touchmove` during drag (debounced to ~30fps max).

**Acceptance Criteria:**
- Dragging a country moves it across the map.
- The polygon shape visibly distorts (stretches/compresses) as latitude changes.
- The distortion is mathematically correct (Mercator projection).
- Performance is smooth at 30fps minimum during drag.

---

### F5 — Multiple Countries

- Multiple countries can be on the map simultaneously (no hard limit, soft cap of ~10 for performance).
- Each has its own color.
- Each can be independently dragged.
- Active state applies to whichever was most recently clicked.

**Acceptance Criteria:**
- At least 3 countries can be on the map at the same time without performance degradation.
- Each country is independently draggable.
- Colors do not repeat (cycle through palette if > 6 countries).

---

### F6 — Selected Country Panel (Active Country Info)

**UI:**
Below the search input within the same card, display a list of all currently selected countries.

Each row shows:
- Flag emoji
- Country name
- A trash / ✕ icon button on the right

**Active Country Highlight:**
- The currently active country's row in the list is highlighted (e.g. slightly darker background or left border accent in its color).
- Clicking a row in the list makes that country active on the map.

**Remove Country:**
- Clicking the trash icon removes the country from the map and from the list.
- If the removed country was active, active state clears (no country is active).

**Acceptance Criteria:**
- All selected countries appear in the panel list with flag + name + delete button.
- Active country row is visually distinguished.
- Clicking a row makes that country active (polygon highlighted on map).
- Delete button removes country from map and list.

---

## Data Requirements

### Country Dataset

Bundle a static JSON file containing all ~195 UN-recognized countries plus major territories:

```ts
interface Country {
  name: string;           // "United States"
  code: string;           // "US"
  centroid: [number, number]; // [lng, lat]
  geojson: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
}
```

Source: Natural Earth 1:110m cultural vectors (public domain), processed into a single bundled JSON.

Flag emojis are derived from ISO codes: `String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))`.

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Initial load time | < 3s on fast 3G |
| GeoJSON bundle size | < 2MB gzipped |
| Drag frame rate | ≥ 30fps |
| Supported browsers | Chrome 120+, Firefox 120+, Safari 17+ |
| Mobile support | Basic (touch drag), not primary target |
| Accessibility | Keyboard nav for search input/dropdown; ARIA labels on controls |

---

## Out of Scope (v1)

- Side-by-side area comparison chart
- Country info panel (population, area stats)
- Sharing / permalink to a specific configuration
- Custom country color picker
- Offline mode
- Mobile-first optimized UX

---

## Environment & Configuration

```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

The Google Maps API key must have the **Maps JavaScript API** enabled. Map ID (optional, for Cloud Styling grayscale theme) can also be configured via env var.

---

## Project Structure

```
/
├── public/
│   └── countries.json          # Bundled GeoJSON dataset
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapContainer.tsx        # Google Maps root
│   │   │   ├── CountryOverlay.tsx      # Single country polygon + drag logic
│   │   │   └── useProjection.ts        # d3-geo Mercator reprojection hook
│   │   ├── Sidebar/
│   │   │   ├── SearchCard.tsx          # Card wrapper
│   │   │   ├── CountrySearch.tsx       # Input + autocomplete dropdown
│   │   │   └── SelectedCountryList.tsx # Active country list with delete
│   │   └── ui/                         # shadcn components
│   ├── store/
│   │   └── mapStore.ts                 # Zustand store: selected countries, active country
│   ├── lib/
│   │   ├── countries.ts                # Country data loader + search
│   │   ├── projection.ts               # d3-geo true-size math
│   │   └── colors.ts                   # Color palette + assignment
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.local
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Key Implementation Notes for Claude Code

1. **Google Maps Setup**: Use `@vis.gl/react-google-maps`. Wrap the app in `<APIProvider apiKey={...}>`. Use `<Map>` component with `mapId` for styled map. For overlays, use `useMap()` hook and construct `google.maps.Polygon` instances imperatively in `useEffect`.

2. **True Size Math**: 
   - At zoom level `z`, Google Maps uses 256 × 2^z pixels for the full world.
   - Pixels per degree longitude at the equator = `(256 × 2^z) / 360`.
   - Mercator y-scale factor at latitude `φ` = `1 / cos(φ × π/180)`.
   - To reproject a country's GeoJSON at a new center `[lng0, lat0]`:
     - For each coordinate `[lng, lat]` in the GeoJSON, compute the offset from the country's true centroid in degrees, then apply the Mercator scale factor at `lat0`, then convert back to `[lng, lat]` relative to `[lng0, lat0]`.

3. **Drag Implementation**: 
   - Add `dragstart`, `drag`, `dragend` listeners to the Google Maps `Polygon`.
   - On `drag`, get the new center lat/lng from the event, call the reprojection function, update polygon paths.
   - Use `requestAnimationFrame` throttling.

4. **GeoJSON Data**: Download from Natural Earth (`ne_110m_admin_0_countries.geojson`). Process with a Node script to:
   - Extract `NAME`, `ISO_A2`, centroid (use `d3-geo`'s `geoCentroid`).
   - Output a single `countries.json` array.
   - Keep geometries simplified (110m scale is sufficient).

5. **shadcn Components to use**: `Command` (for combobox/autocomplete), `Card`, `Badge`, `Button`, `ScrollArea`.

6. **Tailwind**: Use `@layer` for any custom utilities. The card should use `backdrop-blur` for a frosted glass effect over the map.

---

## Acceptance Test Scenarios

| # | Scenario | Expected Result |
|---|---|---|
| 1 | Load app | Full-screen grayscale Google Map renders |
| 2 | Type "braz" in search | Dropdown shows "🇧🇷 Brazil" (and others) |
| 3 | Select Brazil | Green-ish polygon appears over Brazil on map |
| 4 | Select United States | Second polygon appears in different color |
| 5 | Drag Brazil to northern Europe | Brazil's polygon stretches visibly, reflecting true Mercator distortion |
| 6 | Drag Brazil to equator | Polygon returns to normal proportions |
| 7 | Click United States polygon | US becomes active, highlighted in panel |
| 8 | Click ✕ next to Brazil in panel | Brazil removed from map and list |
| 9 | Type Esc in search | Dropdown closes |
| 10 | Scroll mouse on map | Map zooms in/out |
