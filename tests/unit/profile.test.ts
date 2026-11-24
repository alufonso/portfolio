import { describe, it, expect } from 'vitest';
import raw from '../../src/data/profile.json';
import { parseProfile, profile } from '../../src/data/profile';

const clone = () => structuredClone(raw) as any;

describe('profile', () => {
  it('parses the real profile', () => {
    expect(() => parseProfile(raw)).not.toThrow();
  });
  it('rejects a phone field', () => {
    const p = clone();
    p.basic_info.phone = '+62000000000';
    expect(() => parseProfile(p)).toThrow();
  });
  it('rejects an unknown work type', () => {
    const p = clone();
    p.work_experience[0].type = 'Freelance';
    expect(() => parseProfile(p)).toThrow();
  });
  it('every project slug is unique and url-safe', () => {
    const slugs = profile.projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
  it('has the 5 spec singles', () => {
    expect(profile.projects.map((p) => p.slug)).toEqual([
      'haloop-ai', 'petak-app', 'cvsight', 'indobert-lyrics', 'jankenpovision',
    ]);
  });
  it('bullets have no leading "- "', () => {
    const all = [
      ...profile.work_experience.flatMap((w) => w.bullets),
      ...profile.org_experience.flatMap((o) => o.bullets),
      ...profile.projects.flatMap((p) => [...p.case_study.built]),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const b of all) expect(b.startsWith('- ')).toBe(false);
  });
});
