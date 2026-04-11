import { createContext, useContext } from 'react';
import type { Country, PlacedCountry } from '@/types';

export interface MapContextValue {
  placedCountries: PlacedCountry[];
  activeCountryId: string | null;
  panTarget: [number, number] | null;
  addCountry: (country: Country, center?: [number, number]) => void;
  removeCountry: (id: string) => void;
  setActiveCountry: (id: string | null) => void;
  updateCountryCenter: (id: string, center: [number, number]) => void;
  panToCountry: (id: string) => void;
  clearPanTarget: () => void;
}

export const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext<T>(selector: (state: MapContextValue) => T): T {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMapContext must be used within MapProvider');
  return selector(context);
}
