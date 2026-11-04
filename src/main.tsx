import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './app/router';
import { mixes } from './data/mixes';
import { PlayerProvider } from './player/PlayerProvider';
import '@fontsource/gochi-hand/latin-400.css';
import '@fontsource-variable/nunito/wght.css';
import './scss/style.scss';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element.');

createRoot(root).render(
  <StrictMode>
    {/* The player wraps the router, so the audio element survives every route change. */}
    <PlayerProvider mixes={mixes}>
      <RouterProvider router={router} />
    </PlayerProvider>
  </StrictMode>,
);
