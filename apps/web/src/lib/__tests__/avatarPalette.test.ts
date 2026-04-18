import { describe, expect, it } from 'vitest';

import { initialsFor, paletteFor } from '../avatarPalette';

describe('paletteFor', () => {
  it('is deterministic — same id returns same colors', () => {
    const a = paletteFor('book-abc');
    const b = paletteFor('book-abc');
    expect(a).toEqual(b);
  });

  it('returns a valid bg/fg pair', () => {
    const result = paletteFor('book-123');
    expect(result.bg).toMatch(/^linear-gradient/);
    expect(result.fg).toMatch(/^#[0-9a-f]{6,}$/i);
  });

  it('distributes across palette — different ids produce different pairs', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `book-${i}`);
    const uniqueBgs = new Set(ids.map((id) => paletteFor(id).bg));
    expect(uniqueBgs.size).toBeGreaterThan(1);
  });
});

describe('initialsFor', () => {
  it('uses first letter of first two words when name has multiple parts', () => {
    expect(initialsFor('Rhea Williams')).toBe('RW');
  });

  it('falls back to first two chars of a single-word name', () => {
    expect(initialsFor('Rhea')).toBe('RH');
  });

  it('uses email when name is missing', () => {
    expect(initialsFor(null, 'sam@bookshare.io')).toBe('SA');
  });

  it('returns "?" when neither name nor email is available', () => {
    expect(initialsFor(null)).toBe('?');
    expect(initialsFor(undefined, '')).toBe('?');
  });

  it('uppercases consistently', () => {
    expect(initialsFor('maya angelou')).toBe('MA');
  });
});
