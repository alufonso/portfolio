import { C, px, type Px } from './scene/room';

// Sprite rows: one char per pixel, '.' is transparent, other chars index PAL.
const PAL: Record<string, string> = {
  k: C.ink, p: C.paper, a: C.accent, d: C.accentDark, e: C.accentLight, L: C.lamp, m: C.muted,
  l: C.line, n: C.night, N: C.nightLight, w: C.wood, W: C.woodLight, r: C.rain, s: C.screen,
};

export const sprite = (rows: string[], x0 = 0, y0 = 0): Px[] =>
  rows.flatMap((row, y) =>
    [...row.matchAll(/([^.])\1*/g)].map((m): Px => [x0 + m.index!, y0 + y, m[0].length, 1, PAL[m[1]]]));

const frame = (bg: string): Px[] => [[0, 0, 32, 32, bg]];

// Ring of radius 11..13 with a gap in the top-right quadrant, so it reads as a loop arrow.
const loop: Px[] = Array.from({ length: 32 * 32 }, (_, i) => [i % 32, Math.floor(i / 32)] as const)
  .filter(([x, y]) => {
    const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy);
    return d >= 11 && d < 13 && !(dx > 0 && dy < 0 && dx > -dy * 0.6 && -dy > dx * 0.25);
  })
  .map(([x, y]): Px => [x, y, 1, 1, C.lamp]);

const COVERS: Record<string, Px[]> = {
  'cover-haloop-ai': [
    ...frame(C.night),
    ...loop,
    ...sprite(['LLLLL', '.LLLL', '..LLL', '...LL', '....L'], 25, 9), // arrowhead closing the loop
    ...sprite([
      '.pppppppppp.',
      'pppppppppppp',
      'ppkkpkkpkkpp',
      'pppppppppppp',
      'pppppppppppp',
      '.pppppppppp.',
      '.pp.........',
      '.p..........',
    ], 7, 8),
    ...sprite([
      '..........e.',
      '.aaaaaaaaaa.',
      'aaaaaaaaaaaa',
      'aappppappaaa',
      'aaaaaaaaaaaa',
      '.aaaaaaaaaa.',
      '.........aa.',
      '..........a.',
    ], 13, 14),
  ],
  'cover-petak-app': [
    ...frame(C.accent),
    ...sprite([
      '.kkkkkkkkkkk.',
      'kkkkkkkkkkkkk',
      'kkkkkmmmkkkkk',
      'kkppppppppkkk',
      'kkpllllllpkkk',
      'kkpppppppppkk',
      'kkpmmmmmpppkk',
      'kkpppppppppkk',
      'kkpppLLLLLpkk',
      'kkpppppppppkk',
      'kkpmmmmpppppk',
      'kkpppppppppkk',
      'kkpppppLLLpkk',
      'kkpppppppppkk',
      'kkpmmmmmmppkk',
      'kkpppppppppkk',
      'kkpppppppppkk',
      'kkpppppppppkk',
      'kkkkkkkkkkkkk',
      'kkkkkmmmkkkkk',
      'kkkkkkkkkkkkk',
      '.kkkkkkkkkkk.',
    ], 5, 7),
    ...sprite([
      '..kkkkkkkkkkk.',
      '.kLLLLLLLLLLLk',
      'kLLLLLLLLLLLLk',
      'kLLkkLkkLkkLLk',
      'kLLLLLLLLLLLLk',
      '.kLLLLLLLLLLk.',
      '..kLLkkkkkkk..',
      '..kLk.........',
      '..kk..........',
    ], 16, 3),
  ],
  'cover-cvsight': [
    ...frame(C.line),
    ...sprite([
      'kkkkkkkkkkkkk...',
      'kppppppppppppk..',
      'kpaappppppppppk.',
      'kpaappmmmmmppppk',
      'kpppppmmmppppppk',
      'kpppppppppppppppk',
      'kpmmmmmmmmmmmmpk',
      'kpppppppppppppk',
      'kpmmmmmmmmmmppk',
      'kpppppppppppppk',
      'kpmmmmmmmmmmmpk',
      'kpppppppppppppk',
      'kpmmmmmmmpppppk',
      'kpppppppppppppk',
      'kpmmmmmmmmmmppk',
      'kpppppppppppppk',
      'kpppppppppppppk',
      'kpppppppppppppk',
      'kpppppppppppppk',
      'kpppppppppppppk',
      'kkkkkkkkkkkkkkk',
    ], 4, 3),
    ...sprite([
      '...kkkkk...',
      '..kkrrrkk..',
      '.kkrpprrkk.',
      'kkrpprrrrkk',
      'kkrprrrrrkk',
      'kkrrrrrrrkk',
      'kkrrrrrrrkk',
      '.kkrrrrrkk.',
      '..kkkkkkkd.',
      '...kkkkkddd',
      '.........ddd',
      '..........ddd',
      '...........dd',
    ], 15, 15),
  ],
  'cover-indobert-lyrics': [
    ...frame(C.night),
    ...sprite([
      '.....LLLLL',
      '.....LLLLLLL',
      '.....L....LL',
      '.....L.....L',
      '.....L......',
      '.....L......',
      '.....L......',
      '.....L......',
      '..LLLL......',
      '.LLLLL......',
      'LLLLLL......',
      'LLLLL.......',
      '.LLL........',
    ], 3, 4),
    ...sprite([
      '.aa.aa.',
      'aeaaaaa',
      'aaaaaaa',
      '.aaaaa.',
      '..aaa..',
      '...a...',
    ], 21, 4),
    // emotion bars
    [16, 18, 3, 10, C.accent], [20, 14, 3, 14, C.lamp], [24, 21, 3, 7, C.rain], [28, 16, 3, 12, C.line],
    [2, 28, 29, 1, C.nightLight],
  ],
  'cover-jankenpovision': [
    ...frame(C.night),
    // rock (fist)
    ...sprite([
      '.kkkkkkkkkk..',
      'kLLkLLkLLkLk.',
      'kLLkLLkLLkLk.',
      'kLLkLLkLLkLk.',
      'kkkkkkkkkkLLk',
      'kLLLLLLLLLLLk',
      'kLkkkkkLLLLLk',
      'kLLLLLLLLLLk.',
      '.kLLLLLLLLk..',
      '..kLLLLLLk...',
      '..kLLLLLLk...',
    ], 10, 2),
    // paper (open hand)
    ...sprite([
      '.kk.kk.kk.kk...',
      'kLLkLLkLLkLLk..',
      'kLLkLLkLLkLLk..',
      'kLLkLLkLLkLLk..',
      'kLLkLLkLLkLLk.k',
      'kLLLLLLLLLLLkkLk',
      'kLLLLLLLLLLLLLk',
      'kLLLLLLLLLLLLk.',
      'kLLLLLLLLLLLk..',
      '.kLLLLLLLLLk...',
      '..kLLLLLLLk....',
      '..kLLLLLLLk....',
    ], 1, 18),
    // scissors (two fingers in a V)
    ...sprite([
      '.kk.....kk.',
      'kLLk...kLLk',
      'kLLk...kLLk',
      '.kLLk.kLLk.',
      '.kLLk.kLLk.',
      '..kLLkLLk..',
      '.kkLLLLLLk.',
      'kLkLkLLLLLk',
      'kLkLkLLLLLk',
      'kLLLLLLLLk.',
      '.kLLLLLLLk.',
      '..kLLLLLk..',
    ], 19, 18),
  ],
};

export const COVER_IDS = Object.keys(COVERS);

export function Cover({ id, size }: { id: string; size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {px(COVERS[id] ?? [])}
    </svg>
  );
}
