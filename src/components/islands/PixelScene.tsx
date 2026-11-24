import { useEffect, useRef, useState } from 'react';
import { phaseForHour, type Phase } from '../../lib/phase';
import { TABS, parseHash, type Counts, type DeckState } from '../../lib/deck';
import Room from '../../art/scene/room';
import Monitor from '../../art/scene/monitor';
import { Cover } from '../../art/covers';
import '../../art/scene/scene.css';

const ALT: Record<Phase, string> = {
  night: 'Pixel art: Agustar coding at night by a rainy window',
  dusk: 'Pixel art: Agustar coding at dusk by a window',
  morning: 'Pixel art: Agustar coding on an overcast morning by a window',
};

// Props: covers = cover ids in profile project order (Task 8 follow-up; ids only, no profile data).
// Only singles needs the real item count; every other tab counts as one item.
export default function PixelScene({ covers }: { covers: string[] }) {
  const [state, setState] = useState<DeckState>({ tab: 'now-playing', item: 0 });
  const [phase, setPhase] = useState<Phase>('night'); // SSR default = the original night look

  const [awake, setAwake] = useState(false);
  const catTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [live, setLive] = useState(false); // the pet button is dead without JS, so render it after hydration
  useEffect(() => { setPhase(phaseForHour(new Date().getHours())); setLive(true); }, []);
  useEffect(() => () => clearTimeout(catTimer.current), []);

  // Each pet restarts the ~3 s awake window.
  const pet = () => {
    clearTimeout(catTimer.current);
    setAwake(true);
    catTimer.current = setTimeout(() => setAwake(false), 3000);
  };

  useEffect(() => {
    const counts = { ...Object.fromEntries(TABS.map((t) => [t, 1])), singles: covers.length } as Counts;
    const sync = () => setState(parseHash(location.hash, counts));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [covers.length]);

  const { tab } = state;
  const cover = tab === 'singles' ? covers[state.item] : undefined;

  return (
    <div className="scene">
      <svg viewBox="0 0 96 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true" data-phase={phase} data-monitor={tab} data-cover={cover} data-cat={awake ? 'awake' : 'asleep'}>
        <Room>
          <Monitor tab={tab} />
          {/* Cover's own 32x32 viewBox scales it into the monitor's 10x10 slot at (60,13). */}
          {cover && <g transform="translate(60 13)"><Cover id={cover} size={10} /></g>}
        </Room>
      </svg>
      {live && <button type="button" className="sr-only-focusable pet" aria-label="Pet the cat" onClick={pet} />}
      <div className="crt" aria-hidden="true"><div className="grain" /></div>
      <p className="sr-only">{ALT[phase]}</p>
    </div>
  );
}
