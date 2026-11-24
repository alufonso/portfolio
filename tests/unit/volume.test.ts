import { afterEach, beforeEach, expect, test } from 'vitest';
import { readVolume, writeVolume } from '../../src/lib/volume';

const orig = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const stub = (v: unknown) => Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: v });

beforeEach(() => {
  const m = new Map<string, string>();
  stub({ getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
});
afterEach(() => {
  if (orig) Object.defineProperty(globalThis, 'localStorage', orig);
  else delete (globalThis as any).localStorage;
});

test('defaults to 0.5', () => expect(readVolume()).toBe(0.5));
test('round-trips 0.3', () => { writeVolume(0.3); expect(readVolume()).toBe(0.3); });
test('clamps 7 to 1', () => { writeVolume(7); expect(readVolume()).toBe(1); });
test('survives a throwing localStorage', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
  expect(readVolume()).toBe(0.5);
  expect(() => writeVolume(0.2)).not.toThrow();
});
