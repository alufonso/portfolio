import { useCallback, useEffect, useRef, useState } from 'react';
import { TABS, parseHash, formatHash, stepItem, stepTab, type Counts, type DeckState, type TabId } from '../../lib/deck';

type Props = {
  tabs: { id: TabId; twin: string; plain: string }[];
  itemLabels: Record<TabId, string[]>;
};

const same = (a: DeckState, b: DeckState) => a.tab === b.tab && a.item === b.item;

export default function Player({ tabs, itemLabels }: Props) {
  const counts = Object.fromEntries(TABS.map((t) => [t, Math.max(1, itemLabels[t].length)])) as Counts;
  const [s, setS] = useState<DeckState>({ tab: 'now-playing', item: 0 });
  const ref = useRef(s);
  const countsRef = useRef(counts);
  countsRef.current = counts;

  // Single entry point for user-driven changes: update state, write hash, notify other islands.
  const go = useCallback((next: DeckState, focusTab = false) => {
    if (same(next, ref.current)) return;
    ref.current = next;
    setS(next);
    history.replaceState(null, '', formatHash(next));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (focusTab) document.getElementById(`tab-${next.tab}`)?.focus();
  }, []);

  useEffect(() => {
    document.getElementById('deck')?.setAttribute('data-js', '');
    const fromHash = () => {
      const next = parseHash(location.hash, countsRef.current);
      if (same(next, ref.current)) return; // our own dispatch lands here: no-op
      ref.current = next;
      setS(next);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable], [role=tablist]')) return;
      if (e.key === 'ArrowRight') go(stepItem(ref.current, 1, countsRef.current));
      else if (e.key === 'ArrowLeft') go(stepItem(ref.current, -1, countsRef.current));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('hashchange', fromHash);
      document.removeEventListener('keydown', onKey);
    };
  }, [go]);

  // Reflect state onto the static panels.
  useEffect(() => {
    const deck = document.getElementById('deck');
    if (!deck) return;
    deck.dataset.activeTab = s.tab;
    deck.dataset.activeItem = String(s.item);
    deck.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
      const on = p.dataset.panel === s.tab;
      p.classList.toggle('is-active', on);
      p.querySelectorAll<HTMLElement>('[data-item]').forEach((a) =>
        a.setAttribute('aria-expanded', String(on && Number(a.dataset.item) === s.item)),
      );
    });
  }, [s]);

  const onTabKey = (e: React.KeyboardEvent) => {
    const d = ({ ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' } as const)[e.key as 'Home'];
    if (d === undefined || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    go(stepTab(ref.current, d), true);
  };

  const twin = tabs.find((t) => t.id === s.tab)?.twin ?? '';
  const nn = String(s.item + 1).padStart(2, '0');
  const label = itemLabels[s.tab][s.item] ?? '';

  return (
    <div className="player">
      <div role="tablist" aria-label="Sections" onKeyDown={onTabKey} className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-controls={`panel-${t.id}`}
            aria-selected={t.id === s.tab}
            tabIndex={t.id === s.tab ? 0 : -1}
            title={t.plain}
            onClick={() => go({ tab: t.id, item: 0 })}
          >
            {t.twin}
          </button>
        ))}
      </div>
      <div className="transport">
        <button type="button" aria-label="Previous item" onClick={() => go(stepItem(s, -1, counts))}>⏮</button>
        <button type="button" aria-label="Next item" onClick={() => go(stepItem(s, 1, counts))}>⏭</button>
      </div>
      <p data-testid="track-label" className="track">{`${twin} · ${nn} ${label}`}</p>
      <progress value={s.item + 1} max={counts[s.tab]} aria-label="Position in list" />
    </div>
  );
}
