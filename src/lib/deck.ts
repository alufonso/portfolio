export const TABS = ['now-playing', 'playlist', 'singles', 'liner-notes', 'stickers'] as const;
export type TabId = (typeof TABS)[number];
export type Counts = Record<TabId, number>;
export type DeckState = { tab: TabId; item: number };

const isTab = (s: string): s is TabId => (TABS as readonly string[]).includes(s);
const clampItem = (item: number, count: number) => Math.max(0, Math.min(item, count - 1));

// Hash is `#tab` or `#tab/item`; leading '#' optional. Invalid parts fall back safely.
export function parseHash(hash: string, counts: Counts): DeckState {
  const [tabPart, itemPart] = hash.replace(/^#/, '').split('/', 2);
  if (!isTab(tabPart)) return { tab: 'now-playing', item: 0 };
  const item = itemPart !== undefined && /^\d+$/.test(itemPart) ? Number(itemPart) : 0;
  return { tab: tabPart, item: clampItem(item, counts[tabPart]) };
}

export function formatHash(s: DeckState): string {
  return s.item === 0 ? `#${s.tab}` : `#${s.tab}/${s.item}`;
}

// Clamps at both ends; does not wrap.
export function stepItem(s: DeckState, delta: 1 | -1, counts: Counts): DeckState {
  return { tab: s.tab, item: clampItem(s.item + delta, counts[s.tab]) };
}

// Wraps across tabs (ARIA tabs behaviour) and resets the item.
export function stepTab(s: DeckState, delta: 1 | -1 | 'first' | 'last'): DeckState {
  const n = TABS.length;
  const i = TABS.indexOf(s.tab);
  const next =
    delta === 'first' ? 0 : delta === 'last' ? n - 1 : (((i + delta) % n) + n) % n;
  return { tab: TABS[next], item: 0 };
}
