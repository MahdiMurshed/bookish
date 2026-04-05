import { BOOK_GENRES } from '@repo/api-client';
import { Search } from 'lucide-react';

interface BookFiltersProps {
  search: string;
  genre: string;
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
}

export function BookFilters({ search, genre, onSearchChange, onGenreChange }: BookFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full rounded-md border border-input bg-background py-2 pr-3 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <select
        aria-label="Filter by genre"
        value={genre}
        onChange={(e) => onGenreChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">All Genres</option>
        {BOOK_GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </div>
  );
}
