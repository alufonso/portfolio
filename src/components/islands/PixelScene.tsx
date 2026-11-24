import { useEffect, useState } from 'react';
import { TABS, parseHash, type Counts, type DeckState } from '../../lib/deck';
import Room from '../../art/scene/room';
import Monitor from '../../art/scene/monitor';
import { Cover } from '../../art/covers';
import '../../art/scene/scene.css';

// Props: covers = cover ids in profile project order (Task 8 follow-up; ids only, no profile data).
// Only singles needs the real item count; every other tab counts as one item.
export default function PixelScene({ covers }: { covers: string[] }) {
  const [state, setState] = useState<DeckState>({ tab: 'now-playing', item: 0 });

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
      <svg viewBox="0 0 96 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true" data-monitor={tab} data-cover={cover}>
        <Room>
          <Monitor tab={tab} />
          {/* Cover's own 32x32 viewBox scales it into the monitor's 10x10 slot at (60,13). */}
          {cover && <g transform="translate(60 13)"><Cover id={cover} size={10} /></g>}
        </Room>
      </svg>
      <p className="sr-only">Pixel art: Agustar coding at night by a rainy window</p>
    </div>
  );
}
