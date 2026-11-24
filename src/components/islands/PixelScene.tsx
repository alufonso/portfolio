import { useEffect, useState } from 'react';
import { TABS, parseHash, type Counts, type TabId } from '../../lib/deck';
import Room from '../../art/scene/room';
import Monitor from '../../art/scene/monitor';
import '../../art/scene/scene.css';

// Only the tab matters here, so every tab counts as one item.
const ONES = Object.fromEntries(TABS.map((t) => [t, 1])) as Counts;

export default function PixelScene() {
  const [tab, setTab] = useState<TabId>('now-playing');

  useEffect(() => {
    const sync = () => setTab(parseHash(location.hash, ONES).tab);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return (
    <div className="scene">
      <svg viewBox="0 0 96 54" shapeRendering="crispEdges" aria-hidden="true" data-monitor={tab}>
        <Room><Monitor tab={tab} /></Room>
      </svg>
      <p className="sr-only">Pixel art: Agustar coding at night by a rainy window</p>
    </div>
  );
}
