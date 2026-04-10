import type { Feature, Polygon, MultiPolygon, Position } from 'geojson';

/**
 * Reproject a country's GeoJSON so it appears at `targetCenter` on a Mercator map
 * while preserving its true geographic area.
 *
 * The idea: on a Mercator projection, shapes at higher latitudes appear larger
 * because of the 1/cos(lat) scale factor. To show a country at its "true size"
 * when placed at a different latitude, we need to adjust its coordinates so that
 * the Mercator rendering produces the correct visual size.
 *
 * For each coordinate:
 * 1. Compute the offset from the country's real centroid
 * 2. Apply a latitude correction factor: cos(originalLat) / cos(targetLat)
 *    This compensates for the Mercator distortion difference between the two latitudes
 * 3. Place the adjusted offset at the target center
 */
export function reprojectCountry(
  geojson: Feature<Polygon | MultiPolygon>,
  originalCentroid: [number, number], // [lng, lat]
  targetCenter: [number, number] // [lng, lat]
): Feature<Polygon | MultiPolygon> {
  const [origLng, origLat] = originalCentroid;
  const [targetLng, targetLat] = targetCenter;

  const toRad = Math.PI / 180;
  const cosOrig = Math.cos(origLat * toRad);
  const cosTarget = Math.cos(targetLat * toRad);

  // Avoid division by zero near poles
  const latScale = cosTarget > 0.01 ? cosOrig / cosTarget : cosOrig / 0.01;

  function transformCoord(coord: Position): Position {
    const dLng = coord[0] - origLng;
    const dLat = coord[1] - origLat;

    // Scale the offsets by the latitude correction factor
    const newLng = targetLng + dLng * latScale;
    const newLat = targetLat + dLat * latScale;

    return [newLng, newLat];
  }

  function transformRing(ring: Position[]): Position[] {
    return ring.map(transformCoord);
  }

  let newGeometry: Polygon | MultiPolygon;

  if (geojson.geometry.type === 'Polygon') {
    newGeometry = {
      type: 'Polygon',
      coordinates: geojson.geometry.coordinates.map(transformRing),
    };
  } else {
    newGeometry = {
      type: 'MultiPolygon',
      coordinates: geojson.geometry.coordinates.map((polygon) =>
        polygon.map(transformRing)
      ),
    };
  }

  return {
    type: 'Feature',
    properties: geojson.properties,
    geometry: newGeometry,
  };
}

/**
 * Extract all lat/lng paths from a GeoJSON feature for use as Google Maps Polygon paths.
 */
export function geojsonToLatLngPaths(
  geojson: Feature<Polygon | MultiPolygon>
): google.maps.LatLngLiteral[][] {
  const paths: google.maps.LatLngLiteral[][] = [];

  if (geojson.geometry.type === 'Polygon') {
    for (const ring of geojson.geometry.coordinates) {
      paths.push(ring.map(([lng, lat]) => ({ lat, lng })));
    }
  } else {
    for (const polygon of geojson.geometry.coordinates) {
      for (const ring of polygon) {
        paths.push(ring.map(([lng, lat]) => ({ lat, lng })));
      }
    }
  }

  return paths;
}

// ---------------------------------------------------------------------------
// Fast-path helpers for drag: pre-compute offsets once, then apply per frame
// without any intermediate allocations.
// ---------------------------------------------------------------------------

export interface PrecomputedPaths {
  /** Per-ring, per-coordinate offsets from the original centroid */
  offsets: { dLng: number; dLat: number }[][];
  /** cos(originalLat) — constant for a given country */
  cosOrig: number;
  /** Pre-allocated LatLngLiteral arrays reused across frames */
  paths: google.maps.LatLngLiteral[][];
}

/**
 * Pre-compute coordinate offsets and allocate reusable path arrays.
 * Call once when a polygon is created.
 */
export function precomputeOffsets(
  geojson: Feature<Polygon | MultiPolygon>,
  originalCentroid: [number, number]
): PrecomputedPaths {
  const [origLng, origLat] = originalCentroid;
  const cosOrig = Math.cos(origLat * (Math.PI / 180));

  const offsets: { dLng: number; dLat: number }[][] = [];
  const paths: google.maps.LatLngLiteral[][] = [];

  const rings: Position[][] =
    geojson.geometry.type === 'Polygon'
      ? geojson.geometry.coordinates
      : geojson.geometry.coordinates.flat();

  for (const ring of rings) {
    const ringOffsets: { dLng: number; dLat: number }[] = new Array(ring.length);
    const ringPath: google.maps.LatLngLiteral[] = new Array(ring.length);
    for (let i = 0; i < ring.length; i++) {
      ringOffsets[i] = { dLng: ring[i][0] - origLng, dLat: ring[i][1] - origLat };
      ringPath[i] = { lat: 0, lng: 0 }; // placeholder, filled by applyOffsetsToPath
    }
    offsets.push(ringOffsets);
    paths.push(ringPath);
  }

  return { offsets, cosOrig, paths };
}

/**
 * Apply a new target center to pre-computed offsets, writing results
 * directly into the pre-allocated paths arrays. No allocations.
 */
export function applyOffsetsToPath(
  pre: PrecomputedPaths,
  targetCenter: [number, number]
): google.maps.LatLngLiteral[][] {
  const [targetLng, targetLat] = targetCenter;
  const cosTarget = Math.cos(targetLat * (Math.PI / 180));
  const latScale = cosTarget > 0.01 ? pre.cosOrig / cosTarget : pre.cosOrig / 0.01;

  for (let r = 0; r < pre.offsets.length; r++) {
    const ringOffsets = pre.offsets[r];
    const ringPath = pre.paths[r];
    for (let i = 0; i < ringOffsets.length; i++) {
      ringPath[i].lat = targetLat + ringOffsets[i].dLat * latScale;
      ringPath[i].lng = targetLng + ringOffsets[i].dLng * latScale;
    }
  }

  return pre.paths;
}
