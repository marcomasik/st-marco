import { createContext } from 'react';
import type { PlayerController } from './playerController';

export const PlayerContext = createContext<PlayerController | null>(null);
