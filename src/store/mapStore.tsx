import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Country, PlacedCountry } from '@/types';
import { getNextColor } from '@/lib/colors';

interface MapState {
  placedCountries: PlacedCountry[];
  activeCountryId: string | null;
}

type MapAction =
  | { type: 'ADD_COUNTRY'; placed: PlacedCountry }
  | { type: 'REMOVE_COUNTRY'; id: string }
  | { type: 'SET_ACTIVE_COUNTRY'; id: string | null }
  | { type: 'UPDATE_COUNTRY_CENTER'; id: string; center: [number, number] };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'ADD_COUNTRY':
      return {
        placedCountries: [...state.placedCountries, action.placed],
        activeCountryId: action.placed.id,
      };
    case 'REMOVE_COUNTRY':
      return {
        placedCountries: state.placedCountries.filter((c) => c.id !== action.id),
        activeCountryId: state.activeCountryId === action.id ? null : state.activeCountryId,
      };
    case 'SET_ACTIVE_COUNTRY':
      return { ...state, activeCountryId: action.id };
    case 'UPDATE_COUNTRY_CENTER':
      return {
        ...state,
        placedCountries: state.placedCountries.map((c) =>
          c.id === action.id ? { ...c, currentCenter: action.center } : c
        ),
      };
  }
}

interface MapContextValue extends MapState {
  addCountry: (country: Country) => void;
  removeCountry: (id: string) => void;
  setActiveCountry: (id: string | null) => void;
  updateCountryCenter: (id: string, center: [number, number]) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mapReducer, {
    placedCountries: [],
    activeCountryId: null,
  });

  const addCountry = useCallback((country: Country) => {
    const id = `${country.code}-${Date.now()}`;
    const color = getNextColor();
    const placed: PlacedCountry = {
      id,
      country,
      color,
      currentCenter: [...country.centroid],
    };
    dispatch({ type: 'ADD_COUNTRY', placed });
  }, []);

  const removeCountry = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_COUNTRY', id });
  }, []);

  const setActiveCountry = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_COUNTRY', id });
  }, []);

  const updateCountryCenter = useCallback((id: string, center: [number, number]) => {
    dispatch({ type: 'UPDATE_COUNTRY_CENTER', id, center });
  }, []);

  return (
    <MapContext.Provider
      value={{
        ...state,
        addCountry,
        removeCountry,
        setActiveCountry,
        updateCountryCenter,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapStore<T>(selector: (state: MapContextValue) => T): T {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMapStore must be used within MapProvider');
  return selector(context);
}
