import type { UserStats } from '@repo/api-client';
import { Card } from '@repo/ui/components/card';
import { BookOpen, Inbox, Library, MessageSquare, Star } from 'lucide-react';

interface Tile {
  label: string;
  value: number;
  icon: typeof BookOpen;
}

export function tilesFor(stats: UserStats | undefined): Tile[] {
  return [
    { label: 'Books owned', value: stats?.books_owned ?? 0, icon: Library },
    { label: 'Currently lent out', value: stats?.books_lent_out ?? 0, icon: BookOpen },
    { label: 'Currently borrowing', value: stats?.books_borrowed ?? 0, icon: Inbox },
    { label: 'Reviews written', value: stats?.reviews_written ?? 0, icon: Star },
    { label: 'Reviews received', value: stats?.reviews_received ?? 0, icon: MessageSquare },
  ];
}

interface ProfileStatsProps {
  stats: UserStats | undefined;
  loading?: boolean;
}

export function ProfileStats({ stats, loading }: ProfileStatsProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-lg">Activity</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {tilesFor(stats).map(({ label, value, icon: Icon }) => (
          <Card key={label} className="space-y-2 p-4">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <p className="font-bold text-2xl tabular-nums">
              {loading ? <span className="text-muted-foreground/50">—</span> : value}
            </p>
            <p className="text-muted-foreground text-xs">{label}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
