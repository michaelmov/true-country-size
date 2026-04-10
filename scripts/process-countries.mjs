import { readFileSync, writeFileSync } from 'fs';

const raw = JSON.parse(readFileSync('/tmp/ne_110m_admin_0_countries.geojson', 'utf8'));

// Compute centroid of a geometry
function computeCentroid(geometry) {
  const coords = [];
  function extractCoords(c, depth) {
    if (depth === 0) {
      coords.push(c);
    } else {
      for (const item of c) extractCoords(item, depth - 1);
    }
  }
  if (geometry.type === 'Polygon') {
    extractCoords(geometry.coordinates, 2);
  } else if (geometry.type === 'MultiPolygon') {
    extractCoords(geometry.coordinates, 3);
  }
  let sumLng = 0, sumLat = 0;
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / coords.length, sumLat / coords.length];
}

// ISO_A2 overrides for countries where Natural Earth has -99
const isoOverrides = {
  'France': 'FR',
  'Norway': 'NO',
  'Kosovo': 'XK',
  'N. Cyprus': 'CY',
  'Somaliland': 'SO',
  'W. Sahara': 'EH',
  'Indonesia': 'ID',
};

const countries = raw.features
  .filter(f => f.properties.ISO_A2 !== 'AQ') // skip Antarctica
  .map(f => {
    const p = f.properties;
    let code = p.ISO_A2_EH || p.ISO_A2;
    if (code === '-99' || code === -99) {
      code = isoOverrides[p.NAME] || p.ADM0_A3.slice(0, 2).toUpperCase();
    }
    const centroid = computeCentroid(f.geometry);
    return {
      name: p.NAME,
      code: String(code),
      centroid: [Math.round(centroid[0] * 1000) / 1000, Math.round(centroid[1] * 1000) / 1000],
      geojson: {
        type: 'Feature',
        geometry: f.geometry,
      },
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(
  new URL('../public/countries.json', import.meta.url),
  JSON.stringify(countries)
);

console.log(`Processed ${countries.length} countries`);
