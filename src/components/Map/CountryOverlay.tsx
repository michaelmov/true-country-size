import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import {
  precomputeOffsets,
  applyOffsetsToPath,
  type PrecomputedPaths,
} from '@/lib/projection';
import { useMapStore } from '@/store/mapStore';
import type { PlacedCountry } from '@/types';

interface CountryOverlayProps {
  placed: PlacedCountry;
  isActive: boolean;
}

export function CountryOverlay({ placed, isActive }: CountryOverlayProps) {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef<{ lat: number; lng: number } | null>(null);
  const dragCenter = useRef<[number, number]>([...placed.currentCenter]);
  const currentCenterRef = useRef<[number, number]>(placed.currentCenter);
  currentCenterRef.current = placed.currentCenter;
  const rafId = useRef(0);
  const precomputed = useRef<PrecomputedPaths | null>(null);

  const setActiveCountry = useMapStore((s) => s.setActiveCountry);
  const updateCountryCenter = useMapStore((s) => s.updateCountryCenter);

  // Fast path: apply target center using pre-computed offsets (no allocations)
  function updatePolygonFast(center: [number, number]) {
    if (!polygonRef.current || !precomputed.current) return;
    const paths = applyOffsetsToPath(precomputed.current, center);
    polygonRef.current.setPaths(paths);
  }

  // Create / destroy the polygon
  useEffect(() => {
    if (!map) return;

    // Pre-compute offsets once for this country
    const pre = precomputeOffsets(placed.country.geojson, placed.country.centroid);
    precomputed.current = pre;

    // Compute initial paths
    const paths = applyOffsetsToPath(pre, placed.currentCenter);

    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: placed.color,
      strokeWeight: 2,
      strokeOpacity: 1,
      fillColor: placed.color,
      fillOpacity: 0.35,
      map,
      clickable: true,
      zIndex: 1,
    });

    polygonRef.current = polygon;

    // Click to activate
    polygon.addListener('click', () => {
      setActiveCountry(placed.id);
    });

    // Drag: mousedown on polygon
    polygon.addListener('mousedown', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      isDragging.current = true;
      lastMouse.current = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      dragCenter.current = [...currentCenterRef.current];
      map.setOptions({ draggable: false });
      setActiveCountry(placed.id);
    });

    // Drag: mousemove on map — deduplicated via rAF
    const mouseMoveListener = map.addListener(
      'mousemove',
      (e: google.maps.MapMouseEvent) => {
        if (!isDragging.current || !lastMouse.current || !e.latLng) return;

        const dLat = e.latLng.lat() - lastMouse.current.lat;
        const dLng = e.latLng.lng() - lastMouse.current.lng;
        lastMouse.current = { lat: e.latLng.lat(), lng: e.latLng.lng() };

        dragCenter.current = [
          dragCenter.current[0] + dLng,
          dragCenter.current[1] + dLat,
        ];

        // Cancel any pending frame to avoid stacking
        cancelAnimationFrame(rafId.current);
        const newCenter: [number, number] = [...dragCenter.current];
        rafId.current = requestAnimationFrame(() => {
          updatePolygonFast(newCenter);
        });
      }
    );

    const endDrag = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      lastMouse.current = null;
      cancelAnimationFrame(rafId.current);
      map.setOptions({ draggable: true });
      updateCountryCenter(placed.id, dragCenter.current);
    };

    const mouseUpListener = map.addListener('mouseup', endDrag);
    window.addEventListener('mouseup', endDrag);

    return () => {
      cancelAnimationFrame(rafId.current);
      polygon.setMap(null);
      google.maps.event.removeListener(mouseMoveListener);
      google.maps.event.removeListener(mouseUpListener);
      window.removeEventListener('mouseup', endDrag);
      polygonRef.current = null;
      precomputed.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, placed.id, placed.color]);

  // Update paths when currentCenter changes externally (from store)
  useEffect(() => {
    if (!isDragging.current) {
      updatePolygonFast(placed.currentCenter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed.currentCenter]);

  // Update active styling without recreating the polygon
  useEffect(() => {
    if (polygonRef.current) {
      polygonRef.current.setOptions({
        strokeWeight: isActive ? 3 : 2,
        zIndex: isActive ? 10 : 1,
      });
    }
  }, [isActive]);

  return null;
}
