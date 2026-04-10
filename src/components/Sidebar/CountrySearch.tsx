import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { searchCountries, getFlagEmoji } from '@/lib/countries';
import type { Country } from '@/types';

interface CountrySearchProps {
  countries: Country[];
  onSelect: (country: Country) => void;
}

export function CountrySearch({ countries, onSelect }: CountrySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Country[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const matches = searchCountries(countries, query);
    setResults(matches);
    setIsOpen(matches.length > 0);
    setHighlightIndex(0);
  }, [query, countries]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCountry = useCallback(
    (country: Country) => {
      onSelect(country);
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onSelect]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[highlightIndex]) {
      e.preventDefault();
      selectCountry(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search for a country..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full"
        aria-label="Search for a country"
        aria-expanded={isOpen}
        role="combobox"
        aria-autocomplete="list"
      />
      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {results.map((country, index) => (
            <li
              key={country.code + country.name}
              role="option"
              aria-selected={index === highlightIndex}
              className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                index === highlightIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => selectCountry(country)}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              <span className="text-lg">{getFlagEmoji(country.code)}</span>
              <span>{country.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
