import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { getFlagEmoji } from '@/lib/countries';
import { useMapContext } from '@/context/useMapContext';
import { X } from 'lucide-react';

export function SelectedCountryList() {
  const placedCountries = useMapContext((s) => s.placedCountries);
  const activeCountryId = useMapContext((s) => s.activeCountryId);
  const panToCountry = useMapContext((s) => s.panToCountry);
  const removeCountry = useMapContext((s) => s.removeCountry);

  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeCountryId]);

  if (placedCountries.length === 0) return null;

  return (
    <div className="max-h-60 overflow-y-auto pt-2 space-y-1">
        {placedCountries.map((placed) => (
          <div
            key={placed.id}
            ref={placed.id === activeCountryId ? activeRef : undefined}
            className={`flex items-center justify-between rounded-md px-2 py-1.5 border-2 border-transparent transition-colors cursor-pointer ${
              placed.id === activeCountryId ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            style={placed.id === activeCountryId ? { borderColor: placed.color } : undefined}
            onClick={() => panToCountry(placed.id)}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: placed.color }}
              />
              <span className="text-lg leading-none">
                {getFlagEmoji(placed.country.code)}
              </span>
              <span className="text-sm font-medium">{placed.country.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeCountry(placed.id);
              }}
              aria-label={`Remove ${placed.country.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
    </div>
  );
}
