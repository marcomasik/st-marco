import { Outlet, ScrollRestoration } from 'react-router';
import { Boombox } from '../components/Boombox';
import { HangingPanel } from '../components/HangingPanel';
import { PalmFrond } from '../components/PalmFrond';
import { PanelHeader } from '../components/PanelHeader';
import { PhotoDoodles } from '../components/PhotoDoodles';

/**
 * The scene around every page, back to front: the fixed photo (index.html) with its doodles, the palm
 * frond, the hanging panel with the page content, and the boombox player in front.
 */
export function AppLayout() {
  return (
    <div className="scene">
      <PhotoDoodles />
      <PalmFrond />
      <HangingPanel>
        <PanelHeader />
        <main className="panel__content">
          <Outlet />
        </main>
      </HangingPanel>
      <Boombox />
      <ScrollRestoration />
    </div>
  );
}
