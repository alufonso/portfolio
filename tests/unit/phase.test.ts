import { expect, test } from 'vitest';
import { phaseForHour } from '../../src/lib/phase';

test.each([
  [5, 'night'], [6, 'morning'], [15, 'morning'], [16, 'dusk'],
  [18, 'dusk'], [19, 'night'], [23, 'night'], [0, 'night'],
] as const)('hour %i is %s', (h, phase) => expect(phaseForHour(h)).toBe(phase));
