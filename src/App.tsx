import { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapContainer } from '@/components/Map/MapContainer';
import { SearchCard } from '@/components/Sidebar/SearchCard';
import { loadCountries } from '@/lib/countries';
import { useMapStore, MapProvider } from '@/store/mapStore';
import type { Country } from '@/types';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

function AppContent() {
  const [countries, setCountries] = useState<Country[]>([]);
  const addCountry = useMapStore((s) => s.addCountry);

  useEffect(() => {
    loadCountries().then(setCountries);
  }, []);

  return (
    <div className="relative w-full h-full">
      <MapContainer />
      <SearchCard countries={countries} onSelect={addCountry} />
    </div>
  );
}

function App() {
  return (
    <APIProvider apiKey={API_KEY}>
      <MapProvider>
        <AppContent />
      </MapProvider>
    </APIProvider>
  );
}

export default App;
