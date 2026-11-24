export type Phase = 'morning' | 'dusk' | 'night';

export const phaseForHour = (h: number): Phase => (h >= 6 && h < 16 ? 'morning' : h >= 16 && h < 19 ? 'dusk' : 'night');
