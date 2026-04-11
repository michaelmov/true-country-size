import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapContext } from '@/context/useMapContext';

export function MapPanner() {
  const map = useMap();
  const panTarget = useMapContext((s) => s.panTarget);
  const clearPanTarget = useMapContext((s) => s.clearPanTarget);

  useEffect(() => {
    if (panTarget) {
      // panTarget is [lng, lat], Leaflet expects [lat, lng]
      map.flyTo([panTarget[1], panTarget[0]], Math.max(map.getZoom(), 5));
      clearPanTarget();
    }
  }, [panTarget, map, clearPanTarget]);

  return null;
}
