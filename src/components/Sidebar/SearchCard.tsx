import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CountrySearch } from './CountrySearch';
import { SelectedCountryList } from './SelectedCountryList';
import { ThemeToggle } from './ThemeToggle';
import type { Country } from '@/types';

interface SearchCardProps {
  countries: Country[];
  onSelect: (country: Country) => void;
}

export function SearchCard({ countries, onSelect }: SearchCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [overflowVisible, setOverflowVisible] = useState(false);

  const collapse = useCallback(() => {
    setCollapsed(true);
    setOverflowVisible(false);
  }, []);

  useEffect(() => {
    if (collapsed) return;
    const timer = setTimeout(() => setOverflowVisible(true), 300);
    return () => clearTimeout(timer);
  }, [collapsed]);

  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) setCollapsed(false); // swipe up → expand
    if (delta < -SWIPE_THRESHOLD) collapse(); // swipe down → collapse
  }

  const handleSelect = useCallback(
    (country: Country) => {
      onSelect(country);
      collapse();
    },
    [onSelect, collapse],
  );

  return (
    <Card
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        fixed bottom-0 left-0 right-0 z-401 rounded-t-xl rounded-b-none pb-safe
        md:absolute md:bottom-auto md:left-8 md:top-8 md:right-auto md:w-105 md:rounded-xl md:pb-0
        overflow-visible backdrop-blur-md bg-card/90 shadow-lg transition-colors duration-300
      `}
    >
      {/* Mobile drag handle */}
      <div
        className="flex justify-center pt-2 pb-0 md:hidden cursor-pointer"
        onClick={() => (collapsed ? setCollapsed(false) : collapse())}
      >
        <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
      </div>

      <CardHeader className="pb-2 pt-4 px-4 md:pt-4">
        <CardTitle className="text-base font-semibold">True Map Size</CardTitle>
        <CardAction className="md:hidden">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </CardAction>
      </CardHeader>

      {/* Collapsible content — always visible on desktop */}
      <div
        className={`
          transition-[max-height,opacity] duration-300 ease-in-out
          md:!max-h-none md:!opacity-100 md:!overflow-visible
          ${
            collapsed
              ? 'max-h-0 opacity-0 overflow-hidden'
              : `max-h-[500px] opacity-100 ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`
          }
        `}
      >
        <CardContent className="px-4 pb-4">
          <CountrySearch countries={countries} onSelect={handleSelect} />
          <SelectedCountryList />
        </CardContent>
      </div>

      {/* Desktop-only footer */}
      <CardFooter className="hidden md:flex justify-between px-4 py-3">
        <span className="text-xs text-muted-foreground">Theme</span>
        <ThemeToggle />
      </CardFooter>
    </Card>
  );
}
