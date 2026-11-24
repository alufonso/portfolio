import { C, px, type Px } from './scene/room';
import { sprite } from './covers';

// Filled pixel disc centred on the 32x32 grid, one rect per row.
const disc = (r: number, fill: string): Px[] =>
  Array.from({ length: 32 }, (_, y) => Math.round(Math.sqrt(Math.max(0, r * r - (y + 0.5 - 16) ** 2))))
    .flatMap((w, y): Px[] => (w > 0 ? [[16 - w, y, 2 * w, 1, fill]] : []));

// 1px straight line, stepped like Bresenham.
const line = (x0: number, y0: number, x1: number, y1: number, fill: string): Px[] => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  return Array.from({ length: n + 1 }, (_, i): Px => [Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1, fill]);
};

const sticker = (fill: string, motif: string[]): Px[] => [
  ...disc(15, C.ink), ...disc(14, fill), ...disc(13, C.line), ...disc(12, fill),
  ...sprite(motif, 16 - Math.ceil(motif[0].length / 2), 16 - Math.ceil(motif.length / 2)),
];

const BADGES: Record<string, Px[]> = {
  'badge-cloud': sticker(C.night, [
    '..........L...',
    '.........LLL..',
    '....pppp..L...',
    '...pppppp.....',
    '.pppppppppp...',
    'pppppppppppppp',
    'pppppppppppppp',
    '.llllllllllll.',
  ]),
  'badge-ml': [
    ...sticker(C.nightLight, ['']),
    // 3-2-1 neural net: edges first, nodes on top
    ...[9, 15, 21].flatMap((y) => [13, 19].flatMap((y2) => line(10, y, 16, y2, C.line))),
    ...line(17, 13, 22, 16, C.line), ...line(17, 19, 22, 16, C.line),
    ...[9, 15, 21].map((y): Px => [9, y - 1, 3, 3, C.lamp]),
    ...[13, 19].map((y): Px => [15, y - 1, 3, 3, C.paper]),
    [21, 14, 4, 4, C.accentLight],
  ],
  'badge-python': sticker(C.accent, [
    '..........LLLL...',
    '.........LLkLLL..',
    '.........LLLLLLaa',
    '..LLL....LLL...a.',
    '.LLLLL..LLL......',
    'LLLWLLLLLL.......',
    'LL...LLLL........',
  ]),
  'badge-prompt': sticker(C.ink, [
    '.pppppppppppp.',
    'pppppppppppppp',
    'ppkpppppppppp.',
    'pppkpppppppppp',
    'ppkppkkkkppppp',
    'pppppppppppppp',
    '.pppppppppppp.',
    '...pp.........',
    '..pp..........',
  ]),
  'badge-ai': sticker(C.night, [
    '..l.l.l.l.l..',
    '.kkkkkkkkkkk.',
    'lkmmmmmmmmmkl',
    '.kmLLLLLLLmk.',
    'lkmLaaaaaLmkl',
    '.kmLaLLLaLmk.',
    'lkmLaaaaaLmkl',
    '.kmLLLLLLLmk.',
    'lkmmmmmmmmmkl',
    '.kkkkkkkkkkk.',
    '..l.l.l.l.l..',
  ]),
  'badge-spec': sticker(C.muted, [
    '....kkkk....',
    '.kkkLLLLkkk.',
    'kpppkkkkpppk',
    'kpappppppppk',
    'kpaapmmmmppk',
    'kpppppppppk.',
    'kpappppppppk',
    'kpaapmmmmppk',
    'kpppppppppk.',
    'kpkppppppppk',
    'kpkkpmmmmppk',
    'kppppppppppk',
    'kkkkkkkkkkkk',
  ]),
  'badge-growth': sticker(C.wood, [
    '......LLL.',
    '..LL.LLLL.',
    '.LLLLLLL..',
    '.LLLLL....',
    '...LL.....',
    '....L.....',
    '....L.....',
    'aaaaaaaaa.',
    '.ddddddd..',
    '.aaaaaaa..',
    '..aaaaa...',
  ]),
  'badge-finance': sticker(C.night, [
    '.......kkkkkkk..',
    '......kLLLLLLLk.',
    '.kkkkkLLLLkLLLLk',
    'kLLLLkLLLkkkLLLk',
    'kkkkkkLLLkLLLLLk',
    'kLLLLkLLLkkkLLLk',
    'kkkkkkLLLLLkLLLk',
    'kLLLLkLLLkkkLLLk',
    'kkkkkkLLLLkLLLLk',
    'kLLLLLkLLLLLLLk.',
    'kkkkkkkkkkkkkk..',
  ]),
  'badge-web': sticker(C.accent, [
    'kkkkkkkkkkkkkk',
    'kaLpkkkkkkkkkk',
    'kkkkkkkkkkkkkk',
    'kppppppppppppk',
    'kpLLLLLLLLLLpk',
    'kppppppppppppk',
    'kpmmmmpmmmmmpk',
    'kpmmmmpmmmmmpk',
    'kppppppppppppk',
    'kpllllllllllpk',
    'kkkkkkkkkkkkkk',
  ]),
};

export const BADGE_IDS = Object.keys(BADGES);

export function Badge({ id, size }: { id: string; size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {px(BADGES[id] ?? [])}
    </svg>
  );
}
