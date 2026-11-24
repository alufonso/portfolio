import type { TabId } from '../../lib/deck';
import { C, px, type Px } from './room';

// 3x5 pixel glyphs; the head hides the screen below y=23, so content stays in y 13..22.
const GLYPHS: Record<string, string> = {
  A: '010101111101101', G: '011100101101011', U: '101101101101111',
  S: '011100010001110', T: '111010010010010', R: '110101110101101',
};
const word = (text: string, x0: number, y0: number, fill: string): Px[] =>
  [...text].flatMap((ch, i) =>
    [...GLYPHS[ch]].flatMap((bit, j): Px[] =>
      bit === '1' ? [[x0 + i * 4 + (j % 3), y0 + Math.floor(j / 3), 1, 1, fill]] : []));

const badge = (x: number, fill: string): Px[] => [
  [x + 1, 14, 4, 1, fill], [x, 15, 6, 4, fill], [x + 1, 19, 4, 1, fill],
  [x + 2, 16, 2, 2, C.paper], [x + 1, 20, 1, 2, C.accentDark], [x + 4, 20, 1, 2, C.accentDark],
];

const VARIANTS: Record<TabId, Px[]> = {
  'now-playing': [
    ...word('AGUSTAR', 51, 14, C.lamp),
    [51, 20, 18, 1, C.line], [70, 20, 8, 1, C.accentLight],
  ],
  playlist: [
    [52, 14, 5, 1, C.accentLight], [58, 14, 8, 1, C.line],
    [54, 16, 4, 1, C.lamp], [59, 16, 10, 1, C.line],
    [54, 18, 7, 1, C.line], [62, 18, 4, 1, C.accentLight],
    [56, 20, 9, 1, C.lamp], [66, 20, 1, 1, C.line],
    [52, 22, 2, 1, C.line],
  ],
  // The selected cover is drawn at (60,13) 10x10 by PixelScene; this is just its caption.
  singles: [
    [72, 15, 5, 1, C.line], [72, 17, 4, 1, C.muted], [72, 19, 5, 1, C.muted],
  ],
  'liner-notes': [
    [58, 13, 14, 10, C.paper], [71, 13, 1, 1, C.screen], [70, 14, 1, 1, C.line],
    [60, 15, 8, 1, C.accent], [60, 17, 10, 1, C.muted], [60, 19, 9, 1, C.muted], [60, 21, 6, 1, C.muted],
  ],
  stickers: [...badge(52, C.accent), ...badge(62, C.lamp), ...badge(72, C.line)],
};

export default function Monitor({ tab }: { tab: TabId }) {
  return <g className="monitor">{px(VARIANTS[tab])}</g>;
}
