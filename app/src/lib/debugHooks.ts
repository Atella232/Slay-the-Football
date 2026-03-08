import { buildTextSnapshot } from '@/lib/debugState';
import { useGameStore } from '@/store/gameStore';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms?: number) => string;
    setGameSeed?: (seed: number) => number | null;
    getGameSeed?: () => number | null;
  }
}

export function installDebugHooks(): void {
  if (typeof window === 'undefined') return;

  window.render_game_to_text = () => buildTextSnapshot(useGameStore.getState());
  window.advanceTime = () => window.render_game_to_text?.() ?? '';
  window.setGameSeed = (seed: number) => {
    useGameStore.getState().setNextSeed(seed);
    return useGameStore.getState().nextSeed;
  };
  window.getGameSeed = () => {
    const state = useGameStore.getState();
    return state.currentSeed ?? state.nextSeed ?? null;
  };
}
