import { create } from 'zustand';
import type { Country, PlacedCountry } from '@/types';
import { getNextColor } from '@/lib/colors';

interface MapState {
  placedCountries: PlacedCountry[];
  activeCountryId: string | null;
  addCountry: (country: Country) => void;
  removeCountry: (id: string) => void;
  setActiveCountry: (id: string | null) => void;
  updateCountryCenter: (id: string, center: [number, number]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  placedCountries: [],
  activeCountryId: null,

  addCountry: (country) => {
    const id = `${country.code}-${Date.now()}`;
    const color = getNextColor();
    const placed: PlacedCountry = {
      id,
      country,
      color,
      currentCenter: [...country.centroid],
    };
    set((state) => ({
      placedCountries: [...state.placedCountries, placed],
      activeCountryId: id,
    }));
  },

  removeCountry: (id) =>
    set((state) => ({
      placedCountries: state.placedCountries.filter((c) => c.id !== id),
      activeCountryId: state.activeCountryId === id ? null : state.activeCountryId,
    })),

  setActiveCountry: (id) => set({ activeCountryId: id }),

  updateCountryCenter: (id, center) =>
    set((state) => ({
      placedCountries: state.placedCountries.map((c) =>
        c.id === id ? { ...c, currentCenter: center } : c
      ),
    })),
}));
