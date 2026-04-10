# True Size Map

**Live:** [true-country-size.vercel.app](https://true-country-size.vercel.app/)

A React app that visualizes the true geographic size of countries by overlaying them on a Mercator projection Google Map. Search for countries, place them on the map, and drag them across latitudes to see how Mercator distortion affects their apparent size. Multiple countries can be compared simultaneously.

## How It Works

The Mercator projection exaggerates the size of landmasses at higher latitudes (e.g., Greenland appears as large as Africa, when in reality Africa is 14x larger). This app corrects for that distortion using spherical geometry: each country's vertices are stored as angular distances and headings from its centroid, then recomputed at any target latitude using spherical destination math. Combined with `geodesic: true` on Google Maps polygons, countries visually resize in real-time as you drag them across the map.

## Getting Started

### Prerequisites

- Node.js
- A Google Maps API key with the Maps JavaScript API enabled

### Setup

```bash
npm install
```

Create a `.env.local` file with your API key:

```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Other Commands

- `npm run lint` -- ESLint
- `npm run preview` -- preview production build
- `node scripts/process-countries.mjs` -- regenerate `public/countries.json` from Natural Earth GeoJSON

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS v4
- shadcn/ui
- `@vis.gl/react-google-maps`
- Google Maps JavaScript API
