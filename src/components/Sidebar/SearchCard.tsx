import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySearch } from './CountrySearch';
import { SelectedCountryList } from './SelectedCountryList';
import type { Country } from '@/types';

interface SearchCardProps {
  countries: Country[];
  onSelect: (country: Country) => void;
}

export function SearchCard({ countries, onSelect }: SearchCardProps) {
  return (
    <Card className="absolute top-4 left-4 z-10 w-72 overflow-visible backdrop-blur-md bg-card/90 shadow-lg">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold">True Country Size</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <CountrySearch countries={countries} onSelect={onSelect} />
        <SelectedCountryList />
      </CardContent>
    </Card>
  );
}
