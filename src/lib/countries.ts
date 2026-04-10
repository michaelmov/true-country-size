import type { Country } from '@/types';

let countriesCache: Country[] | null = null;

export async function loadCountries(): Promise<Country[]> {
  if (countriesCache) return countriesCache;
  const res = await fetch('/countries.json');
  const data: Country[] = await res.json();
  countriesCache = data;
  return data;
}

export function searchCountries(countries: Country[], query: string): Country[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return countries
    .filter((c) => c.name.toLowerCase().includes(q))
    .slice(0, 8);
}

export function getFlagEmoji(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}
