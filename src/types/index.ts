import type { Feature, Polygon, MultiPolygon } from 'geojson';

export interface Country {
  name: string;
  code: string;
  centroid: [number, number]; // [lng, lat]
  geojson: Feature<Polygon | MultiPolygon>;
}

export interface PlacedCountry {
  id: string;
  country: Country;
  color: string;
  currentCenter: [number, number]; // [lng, lat] - where the user dragged it
}
