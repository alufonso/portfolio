import { describe, it, expect } from 'vitest';
import { profile } from '../../src/data/profile';
import { COVER_IDS } from '../../src/art/covers';
import { BADGE_IDS } from '../../src/art/badges';

describe('art', () => {
  it('has a cover for every project', () => {
    for (const p of profile.projects) expect(COVER_IDS).toContain(p.cover);
  });
  it('has a badge for every certificate', () => {
    for (const c of profile.certificates) expect(BADGE_IDS).toContain(c.badge);
  });
});
