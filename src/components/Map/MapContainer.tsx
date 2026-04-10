import { Map } from '@vis.gl/react-google-maps';
import { CountryOverlay } from './CountryOverlay';
import { useMapStore } from '@/store/mapStore';

const GRAYSCALE_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ saturation: -100 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }, { visibility: 'off' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }, { visibility: 'simplified' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e0e0e0' }],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9d6df' }],
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
];

export function MapContainer() {
  const placedCountries = useMapStore((s) => s.placedCountries);
  const activeCountryId = useMapStore((s) => s.activeCountryId);

  return (
    <Map
      defaultCenter={{ lat: 20, lng: 0 }}
      defaultZoom={3}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl={false}
      styles={GRAYSCALE_STYLES}
      className="w-full h-full"
    >
      {placedCountries.map((placed) => (
        <CountryOverlay
          key={placed.id}
          placed={placed}
          isActive={placed.id === activeCountryId}
        />
      ))}
    </Map>
  );
}
