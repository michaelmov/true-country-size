import { useReducer, useCallback, type ReactNode } from 'react';
import type { Country, PlacedCountry } from '@/types';
import { getNextColor } from '@/lib/colors';
import { MapContext } from './useMapContext';

interface MapState {
  placedCountries: PlacedCountry[];
  activeCountryId: string | null;
  panTarget: [number, number] | null;
}

type MapAction =
  | { type: 'ADD_COUNTRY'; placed: PlacedCountry }
  | { type: 'REMOVE_COUNTRY'; id: string }
  | { type: 'SET_ACTIVE_COUNTRY'; id: string | null }
  | { type: 'UPDATE_COUNTRY_CENTER'; id: string; center: [number, number] }
  | { type: 'PAN_TO'; id: string; center: [number, number] }
  | { type: 'CLEAR_PAN_TARGET' };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'ADD_COUNTRY':
      return {
        ...state,
        placedCountries: [...state.placedCountries, action.placed],
        activeCountryId: action.placed.id,
        panTarget: action.placed.currentCenter,
      };
    case 'REMOVE_COUNTRY':
      return {
        ...state,
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
    case 'PAN_TO':
      return { ...state, activeCountryId: action.id, panTarget: action.center };
    case 'CLEAR_PAN_TARGET':
      return { ...state, panTarget: null };
  }
}

export function MapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mapReducer, {
    placedCountries: [],
    activeCountryId: null,
    panTarget: null,
  });

  const addCountry = useCallback((country: Country, center?: [number, number]) => {
    const id = `${country.code}-${Date.now()}`;
    const color = getNextColor();
    const placed: PlacedCountry = {
      id,
      country,
      color,
      currentCenter: center ? [...center] : [...country.centroid],
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

  const panToCountry = useCallback(
    (id: string) => {
      const placed = state.placedCountries.find((c) => c.id === id);
      if (placed) {
        dispatch({ type: 'PAN_TO', id, center: placed.currentCenter });
      }
    },
    [state.placedCountries]
  );

  const clearPanTarget = useCallback(() => {
    dispatch({ type: 'CLEAR_PAN_TARGET' });
  }, []);

  return (
    <MapContext.Provider
      value={{
        ...state,
        addCountry,
        removeCountry,
        setActiveCountry,
        updateCountryCenter,
        panToCountry,
        clearPanTarget,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
