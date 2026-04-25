import type { UserStats } from '@repo/api-client';
import { describe, expect, it } from 'vitest';

import { tilesFor } from '../ProfileStats';

describe('tilesFor', () => {
  it('maps every UserStats field into a labeled tile in display order', () => {
    const stats: UserStats = {
      books_owned: 4,
      books_lent_out: 1,
      books_borrowed: 2,
      reviews_written: 3,
      reviews_received: 5,
    };

    const labelsAndValues = tilesFor(stats).map(({ label, value }) => ({ label, value }));

    expect(labelsAndValues).toEqual([
      { label: 'Books owned', value: 4 },
      { label: 'Currently lent out', value: 1 },
      { label: 'Currently borrowing', value: 2 },
      { label: 'Reviews written', value: 3 },
      { label: 'Reviews received', value: 5 },
    ]);
  });

  it('renders zeros for every tile when stats are undefined (loading/empty state)', () => {
    expect(tilesFor(undefined).every((t) => t.value === 0)).toBe(true);
    expect(tilesFor(undefined)).toHaveLength(5);
  });
});
