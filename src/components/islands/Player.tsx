import { useCallback, useEffect, useRef, useState } from 'react';
import { createLofiEngine, type LofiEngine } from '../../audio/lofi-engine';
import { readVolume, writeVolume } from '../../lib/volume';
import '../../styles/player.css';
import { TABS, parseHash, formatHash, stepItem, stepTab, type Counts, type DeckState, type TabId } from '../../lib/deck';

type Props = {
  tabs: { id: TabId; twin: string; plain: string }[];
  itemLabels: Record<TabId, string[]>;
};

const CRT_KEY = 'lofi-crt';
const same = (a: DeckState, b: DeckState) => a.tab === b.tab && a.item === b.item;

export default function Player({ tabs, itemLabels }: Props) {
  const counts = Object.fromEntries(TABS.map((t) => [t, Math.max(1, itemLabels[t].length)])) as Counts;
  const [s, setS] = useState<DeckState>({ tab: 'now-playing', item: 0 });
  const ref = useRef(s);
  const countsRef = useRef(counts);
  countsRef.current = counts;
  const engine = useRef<LofiEngine | null>(null);
  const [on, setOn] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [vol, setVol] = useState(0.5);
  const [crt, setCrt] = useState(false);
  const scrollNext = useRef(false); // set by user-driven changes only, so mount/deep-link never scrolls

  // Single entry point for user-driven changes: update state, write hash, notify other islands.
  const go = useCallback((next: DeckState, focusTab = false) => {
    if (same(next, ref.current)) return;
    ref.current = next;
    scrollNext.current = true;
    setS(next);
    history.replaceState(null, '', formatHash(next));
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    if (focusTab) document.getElementById(`tab-${next.tab}`)?.focus();
  }, []);

  useEffect(() => {
    const deck = document.getElementById('deck');
    deck?.setAttribute('data-js', '');
    // Panels become keyboard-reachable once JS shows one at a time.
    deck?.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => p.setAttribute('tabindex', '0'));
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
    // Never auto-resume: hidden stops, visible does nothing.
    const onVis = () => {
      if (document.visibilityState === 'hidden') { engine.current?.stop(); setOn(false); }
    };
    fromHash();
    try { setCrt(localStorage.getItem(CRT_KEY) === '1'); } catch { /* storage unavailable: CRT stays off */ }
    const v = readVolume();
    setVol(v);
    engine.current = createLofiEngine(); // no AudioContext until start()
    engine.current.setVolume(v);
    window.addEventListener('hashchange', fromHash);
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      engine.current?.stop();
      window.removeEventListener('hashchange', fromHash);
      document.removeEventListener('keydown', onKey);
    };
  }, [go]);

  // The scene island draws the overlay; it keys on html[data-crt].
  useEffect(() => { document.documentElement.toggleAttribute('data-crt', crt); }, [crt]);

  const toggleCrt = () => {
    setCrt(!crt);
    try { localStorage.setItem(CRT_KEY, crt ? '0' : '1'); } catch { /* not remembered */ }
  };

  // Reflect state onto the static panels.
  useEffect(() => {
    const deck = document.getElementById('deck');
    if (!deck) return;
    deck.dataset.activeTab = s.tab;
    deck.dataset.activeItem = String(s.item);
    deck.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
      const on = p.dataset.panel === s.tab;
      p.classList.toggle('is-active', on);
      p.querySelectorAll<HTMLElement>('[data-item]').forEach((a) => {
        if (on && Number(a.dataset.item) === s.item) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
    if (scrollNext.current) {
      scrollNext.current = false;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      deck.querySelector('[data-panel].is-active [data-item][aria-current="true"]')
        ?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [s]);

  const onTabKey = (e: React.KeyboardEvent) => {
    const d = ({ ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' } as const)[e.key as 'Home'];
    if (d === undefined || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    go(stepTab(ref.current, d), true);
  };

  const toggle = async () => {
    const e = engine.current;
    if (!e) return;
    if (e.playing) { e.stop(); setOn(false); return; }
    try { await e.start(); setOn(e.playing); } catch { setUnavailable(true); }
  };

  const twin = tabs.find((t) => t.id === s.tab)?.twin ?? '';
  const nn = String(s.item + 1).padStart(2, '0');
  const label = itemLabels[s.tab][s.item] ?? '';

  return (
    <div className="player px-corners px-shadow">
      <div role="tablist" aria-label="Sections" onKeyDown={onTabKey} className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            className="px-corners px-top"
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
        <button type="button" className="px-corners px-shadow" aria-label="Previous item" onClick={() => go(stepItem(s, -1, counts))}>⏮</button>
        <button type="button" className="px-corners px-shadow" aria-label={on ? 'Pause music' : 'Play music'} disabled={unavailable} onClick={toggle}>{on ? '❚❚' : '▶'}</button>
        <button type="button" className="px-corners px-shadow" aria-label="Next item" onClick={() => go(stepItem(s, 1, counts))}>⏭</button>
        <input
          type="range" aria-label="Volume" min={0} max={1} step={0.01} value={vol}
          onChange={(e) => { const v = Number(e.target.value); setVol(v); writeVolume(v); engine.current?.setVolume(v); }}
        />
        {unavailable && <span role="status">Audio unavailable</span>}
        <button type="button" className="crt-toggle px-corners px-shadow" aria-pressed={crt} onClick={toggleCrt}>CRT effect</button>
      </div>
      <p data-testid="track-label" className="track">{`${twin} · ${nn} ${label}`}</p>
      <progress value={s.item + 1} max={counts[s.tab]} aria-label="Position in list" />
    </div>
  );
}
