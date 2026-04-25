import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { ArrowRight, BookOpen, Heart, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCommunityStats } from '@/hooks/useUser';

export default function Home() {
  const { data: stats, isLoading } = useCommunityStats();

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="space-y-6 py-8 text-center sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="font-medium text-primary">
            A neighborhood library, made of your shelves
          </span>
        </div>

        <h1 className="mx-auto max-w-3xl text-balance font-bold text-4xl leading-tight tracking-tight sm:text-5xl">
          Lend a book. Borrow a book. Build a reading community.
        </h1>

        <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
          BookShare turns your bookshelf into a borrowable catalog and connects you with neighbors
          who want to read what you've already finished.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="font-semibold">
            <Link to="/signup">
              Create an account
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-semibold">
            <Link to="/signin">I already have one</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-center font-semibold text-2xl">Community at a glance</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Books shareable"
            value={isLoading ? null : (stats?.books_count ?? 0)}
            icon={BookOpen}
          />
          <StatCard
            label="Members"
            value={isLoading ? null : (stats?.members_count ?? 0)}
            icon={Users}
          />
          <StatCard
            label="Successful borrows"
            value={isLoading ? null : (stats?.completed_borrows_count ?? 0)}
            icon={Heart}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  icon: typeof BookOpen;
}) {
  return (
    <Card className="space-y-2 p-6 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
      <p className="font-bold text-3xl tabular-nums">
        {value === null ? (
          <span className="text-muted-foreground/50">—</span>
        ) : (
          value.toLocaleString()
        )}
      </p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </Card>
  );
}
