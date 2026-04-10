import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFlagEmoji } from '@/lib/countries';
import { useMapStore } from '@/store/mapStore';
import { X } from 'lucide-react';

export function SelectedCountryList() {
  const placedCountries = useMapStore((s) => s.placedCountries);
  const activeCountryId = useMapStore((s) => s.activeCountryId);
  const setActiveCountry = useMapStore((s) => s.setActiveCountry);
  const removeCountry = useMapStore((s) => s.removeCountry);

  if (placedCountries.length === 0) return null;

  return (
    <ScrollArea className="max-h-60">
      <div className="space-y-1 pt-2">
        {placedCountries.map((placed) => (
          <div
            key={placed.id}
            className={`flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
              placed.id === activeCountryId
                ? 'bg-accent'
                : 'hover:bg-accent/50'
            }`}
            onClick={() => setActiveCountry(placed.id)}
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
              className="h-6 w-6 shrink-0"
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
    </ScrollArea>
  );
}
