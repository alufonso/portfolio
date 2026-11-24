import type { ReactNode } from 'react';

// Palette (global constraints) plus a few derived shades.
export const C = {
  paper: '#f6f1e9', ink: '#2b2520', accent: '#b5532a', night: '#2a2238',
  lamp: '#f2b45c', muted: '#6b6058', line: '#e3d9cc',
  glass: '#1a1626', city: '#221c30', rain: '#7a7192', nightLight: '#3a3150',
  wood: '#6e4a36', woodDark: '#4a3428', woodLight: '#8a5c40', floor: '#3b2c26',
  accentDark: '#8a3d1f', accentDeep: '#6a2f18', accentLight: '#cf6a3c',
  bezel: '#1b1820', screen: '#24304a', gear: '#3a3040', gearLight: '#4d4258',
  // time-of-day shades (see PHASES)
  wallMorning: '#4b4560', glassMorning: '#9aa6b8', horizonMorning: '#b9c0c9', cityMorning: '#6d6f86',
  wallDusk: '#3d2a40', glassDusk: '#5e3f63', horizonDusk: '#d9824a', cityDusk: '#3a2638',
};

// Phase palette as CSS custom properties keyed on the svg's data-phase; night = the original look.
const PHASES = {
  night: { wall: C.night, glass: C.glass, horizon: C.glass, city: C.city, lights: 1, moon: 1, lamp: 1 },
  dusk: { wall: C.wallDusk, glass: C.glassDusk, horizon: C.horizonDusk, city: C.cityDusk, lights: 0.8, moon: 0.4, lamp: 0.8 },
  morning: { wall: C.wallMorning, glass: C.glassMorning, horizon: C.horizonMorning, city: C.cityMorning, lights: 0, moon: 0, lamp: 0.35 },
};
const phaseCss = Object.entries(PHASES).map(([k, v]) =>
  `svg[data-phase=${k}]{${Object.entries(v).map(([n, x]) => `--${n}:${x}`).join(';')}}`).join('');

export type Px = [x: number, y: number, w: number, h: number, fill: string, opacity?: number];

export const px = (list: Px[]) =>
  list.map(([x, y, width, height, fill, opacity], i) => (
    <rect key={i} x={x} y={y} width={width} height={height} fill={fill} opacity={opacity} />
  ));

// Rain pattern repeats every 10px so translating it by 10px loops seamlessly.
const DROPS: [number, number][] = [[9, 1], [13, 6], [17, 3], [23, 8], [26, 2], [30, 5], [11, 9], [28, 0], [21, 4], [15, 0]];
const rain: Px[] = [-10, 0, 10, 20].flatMap((dy) => DROPS.map(([x, y]): Px => [x, y + dy, 1, 3, C.rain, 0.55]));

const wall: Px[] = [
  [0, 46, 96, 1, C.nightLight],
  [0, 47, 96, 7, C.floor],
  [0, 50, 40, 1, C.woodDark], [44, 52, 52, 1, C.woodDark],
  // record poster
  [85, 4, 9, 10, C.muted], [86, 5, 7, 8, C.bezel],
  [87, 7, 5, 4, C.ink], [88, 6, 3, 6, C.ink], [89, 8, 1, 2, C.accent],
  // shelf with books
  [37, 15, 10, 1, C.woodLight], [37, 16, 10, 1, C.woodDark],
  [38, 9, 2, 6, C.accent], [40, 10, 2, 5, C.muted], [42, 8, 1, 7, C.line], [43, 13, 3, 2, C.lamp],
];

const windowBack: Px[] = [
  [1, 3, 38, 1, C.muted], // curtain rod
  [5, 5, 30, 24, C.woodDark],
];
const glass: Px[] = [[7, 7, 26, 20, C.glass]];
const horizon: Px[] = [[7, 19, 26, 8, C.glass]];
const moon: Px[] = [[28, 9, 2, 1, C.line], [27, 10, 4, 2, C.line], [28, 12, 2, 1, C.line]];
const city: Px[] = [[7, 22, 5, 5, C.city], [12, 24, 4, 3, C.city], [16, 21, 4, 6, C.city], [21, 23, 6, 4, C.city], [27, 20, 6, 7, C.city]];
const cityLights: Px[] = [
  [9, 23, 1, 1, C.lamp, 0.8], [17, 22, 1, 1, C.lamp, 0.8], [18, 24, 1, 1, C.lamp, 0.6], [23, 24, 1, 1, C.lamp, 0.7], [29, 22, 1, 1, C.lamp, 0.8], [31, 24, 1, 1, C.lamp, 0.6],
];

const windowFront: Px[] = [
  [19, 7, 2, 20, C.woodDark], [7, 16, 26, 2, C.woodDark],
  [4, 29, 32, 2, C.woodLight], [5, 31, 30, 1, C.bezel],
  // curtains
  [1, 4, 5, 27, C.muted], [3, 4, 1, 27, '#574e47'], [34, 4, 5, 27, C.muted], [36, 4, 1, 27, '#574e47'],
];

const desk: Px[] = [
  [36, 36, 60, 2, C.woodLight], [36, 38, 60, 2, C.wood],
  [38, 40, 2, 7, C.woodDark], [92, 40, 2, 7, C.woodDark],
  // mug with coffee
  [40, 31, 4, 5, C.line], [41, 31, 2, 1, C.woodDark], [40, 33, 4, 1, C.accent],
  [44, 32, 2, 1, C.line], [45, 33, 1, 1, C.line], [44, 34, 2, 1, C.line],
  // notebook
  [46, 35, 7, 1, C.paper], [46, 34, 6, 1, C.line],
];

const steam: Px[] = [[41, 28, 1, 2, C.line, 0.6], [42, 26, 1, 2, C.line, 0.5], [41, 24, 1, 2, C.line, 0.35]];

const monitorBody: Px[] = [
  [46, 8, 38, 26, '#3a4466', 0.25], // glow on the wall
  [48, 10, 34, 22, C.bezel],
  [50, 12, 30, 18, C.screen],
  [78, 30, 1, 1, C.lamp],
  [63, 32, 4, 3, C.bezel], [60, 35, 10, 1, C.bezel],
  [73, 35, 2, 1, C.line], // mouse
];

const lampBody: Px[] = [
  [85, 35, 7, 1, C.bezel], [86, 34, 5, 1, C.gear],
  [88, 29, 1, 5, C.muted], [87, 26, 1, 3, C.muted], [86, 25, 1, 1, C.muted],
  [85, 19, 3, 1, C.accentDark], [84, 20, 5, 1, C.accent], [83, 21, 7, 1, C.accent], [82, 22, 9, 1, C.accentDark],
  [84, 23, 5, 1, C.lamp],
];

// Nested warm halo around the shade, plus a pool of light on the desk.
const lampGlow: Px[] = [
  [76, 14, 20, 16, C.lamp, 0.05], [79, 16, 15, 12, C.lamp, 0.07], [81, 18, 11, 8, C.lamp, 0.09],
  [74, 36, 22, 1, C.lamp, 0.5], [78, 37, 14, 1, C.lamp, 0.2],
];

const figure: Px[] = [
  // arms / elbows
  [48, 37, 3, 6, C.accentDark], [71, 37, 3, 6, C.accentLight],
  // torso
  [52, 33, 18, 1, C.accent], [51, 34, 20, 1, C.accent], [50, 35, 22, 12, C.accent],
  [50, 35, 2, 12, C.accentDark], [70, 35, 2, 12, C.accentLight], [60, 37, 2, 10, C.accentDark],
  // hood bunched behind the neck
  [55, 31, 12, 3, C.accentDark], [57, 33, 8, 1, C.accentDeep], [56, 34, 10, 1, C.accentDark],
  // head (hair, from behind)
  [58, 24, 6, 1, C.ink], [57, 25, 8, 1, C.ink], [56, 26, 10, 5, C.ink],
  [59, 25, 3, 1, '#3d3430'], [57, 27, 2, 1, '#3d3430'], [65, 27, 1, 3, '#5a3f2a'],
  // headphones
  [57, 23, 8, 1, C.gear], [56, 24, 1, 2, C.gear], [65, 24, 1, 2, C.gear],
  [54, 26, 2, 4, C.gear], [66, 26, 2, 4, C.gear], [67, 27, 1, 2, C.lamp], [54, 27, 1, 2, C.gearLight],
  // chair back in front of the lower back
  [54, 41, 14, 1, C.gear], [53, 42, 16, 6, C.gear], [67, 42, 1, 5, C.gearLight],
  [60, 48, 2, 3, C.bezel], [55, 51, 12, 1, C.bezel], [55, 52, 1, 1, C.bezel], [66, 52, 1, 1, C.bezel],
];

export default function Room({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{phaseCss}</style>
      <rect className="wall" width="96" height="54" fill={C.night} />
      {px(wall)}
      {px(windowBack)}
      <g className="glass">{px(glass)}</g>
      <g className="horizon">{px(horizon)}</g>
      <g className="moon">{px(moon)}</g>
      <g className="city">{px(city)}</g>
      <g className="city-lights">{px(cityLights)}</g>
      <clipPath id="glass"><rect x="7" y="7" width="26" height="20" /></clipPath>
      <g clipPath="url(#glass)"><g className="rain">{px(rain)}</g></g>
      {px(windowFront)}
      {px(desk)}
      <g className="steam">{px(steam)}</g>
      {px(monitorBody)}
      {children}
      <rect className="screen-flicker" x="50" y="12" width="30" height="18" fill={C.paper} opacity="0.04" />
      {px(figure)}
      <g className="lamp-phase"><g className="lamp">{px(lampGlow)}</g></g>
      {px(lampBody)}
    </>
  );
}
