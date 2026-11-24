import { describe, it, expect } from 'vitest';
import { parseHash, formatHash, stepItem, stepTab, type Counts } from '../../src/lib/deck';

const counts: Counts = { 'now-playing': 1, playlist: 5, singles: 5, 'liner-notes': 2, stickers: 9 };

describe('parseHash', () => {
  it('defaults to now-playing/0 for empty hash', () => {
    expect(parseHash('', counts)).toEqual({ tab: 'now-playing', item: 0 });
  });
  it('accepts a hash with or without leading #', () => {
    expect(parseHash('#playlist', counts)).toEqual({ tab: 'playlist', item: 0 });
    expect(parseHash('playlist/2', counts)).toEqual({ tab: 'playlist', item: 2 });
  });
  it('parses tab and item', () => {
    expect(parseHash('#playlist/2', counts)).toEqual({ tab: 'playlist', item: 2 });
  });
  it('clamps an item above max to counts-1', () => {
    expect(parseHash('#playlist/99', counts)).toEqual({ tab: 'playlist', item: 4 });
  });
  it('falls back to item 0 for negative item', () => {
    expect(parseHash('#singles/-1', counts)).toEqual({ tab: 'singles', item: 0 });
  });
  it('falls back to now-playing/0 for unknown tab', () => {
    expect(parseHash('#xyz/abc', counts)).toEqual({ tab: 'now-playing', item: 0 });
  });
  it('falls back to item 0 for non-integer item', () => {
    expect(parseHash('#stickers/2.5', counts)).toEqual({ tab: 'stickers', item: 0 });
  });
});

describe('formatHash', () => {
  it('omits item when 0', () => {
    expect(formatHash({ tab: 'playlist', item: 0 })).toBe('#playlist');
  });
  it('includes item when non-zero', () => {
    expect(formatHash({ tab: 'playlist', item: 3 })).toBe('#playlist/3');
  });
});

describe('stepItem', () => {
  it('advances by one', () => {
    expect(stepItem({ tab: 'playlist', item: 1 }, 1, counts)).toEqual({ tab: 'playlist', item: 2 });
  });
  it('stays at the last item when stepping past it', () => {
    expect(stepItem({ tab: 'playlist', item: 4 }, 1, counts)).toEqual({ tab: 'playlist', item: 4 });
  });
  it('clamps at 0 when stepping back from 0', () => {
    expect(stepItem({ tab: 'playlist', item: 0 }, -1, counts)).toEqual({ tab: 'playlist', item: 0 });
  });
});

describe('stepTab', () => {
  it('wraps forward from last to first', () => {
    expect(stepTab({ tab: 'stickers', item: 3 }, 1)).toEqual({ tab: 'now-playing', item: 0 });
  });
  it('wraps backward from first to last', () => {
    expect(stepTab({ tab: 'now-playing', item: 0 }, -1)).toEqual({ tab: 'stickers', item: 0 });
  });
  it("'first' and 'last' jump and reset item", () => {
    expect(stepTab({ tab: 'stickers', item: 2 }, 'first')).toEqual({ tab: 'now-playing', item: 0 });
    expect(stepTab({ tab: 'playlist', item: 2 }, 'last')).toEqual({ tab: 'stickers', item: 0 });
  });
});
