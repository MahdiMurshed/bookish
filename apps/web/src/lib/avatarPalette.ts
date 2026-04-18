// Deterministic book-id -> avatar color palette. Mirrors the 10-pair palette
// from the messages design handoff's data.js so inbox row avatars and the
// cross-page toast share the same tint per book.
//
// Initials on a tinted background are the pattern for inbox rows. The real
// cover image (when present) is used in the thread-header mini-cover; the
// palette there serves as a fallback.

export interface AvatarColors {
  bg: string;
  fg: string;
}

const PALETTE: AvatarColors[] = [
  { bg: 'linear-gradient(160deg,#7a3b2e,#2c1810)', fg: '#f3e8c8' },
  { bg: 'linear-gradient(160deg,#1a3a5c,#0a1828)', fg: '#e8eef7' },
  { bg: 'linear-gradient(160deg,#2d5048,#0f2320)', fg: '#e3f1e8' },
  { bg: 'linear-gradient(160deg,#5a4828,#231a0d)', fg: '#f4e6c4' },
  { bg: 'linear-gradient(160deg,#4a2860,#180a28)', fg: '#eedcff' },
  { bg: 'linear-gradient(160deg,#8c2d2d,#2b0808)', fg: '#ffe6d4' },
  { bg: 'linear-gradient(160deg,#184a5a,#061e28)', fg: '#d7ecf1' },
  { bg: 'linear-gradient(160deg,#3a3a3a,#0a0a0a)', fg: '#ffffff' },
  { bg: 'linear-gradient(160deg,#c28a2d,#463010)', fg: '#0f0a00' },
  { bg: 'linear-gradient(160deg,#214e2d,#081a0d)', fg: '#dff3e4' },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function paletteFor(bookId: string): AvatarColors {
  return PALETTE[hashString(bookId) % PALETTE.length]!;
}

export function initialsFor(name: string | null | undefined, email?: string | null): string {
  const source = (name ?? email ?? '?').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
