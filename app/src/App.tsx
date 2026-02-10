import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Combat } from '@/components/Combat';
import { EventRoom } from '@/components/EventRoom';
import { GameOver } from '@/components/GameOver';
import { MapComponent } from '@/components/Map';
import { RestSite } from '@/components/RestSite';
import { RewardScreen } from '@/components/RewardScreen';
import { Shop } from '@/components/Shop';
import { TeamSelect } from '@/components/TeamSelect';
import { TreasureRoom } from '@/components/TreasureRoom';
import { Toaster } from '@/components/ui/sonner';
import { useGameStore } from '@/store/gameStore';

function ScreenTransition({ children, screenKey }: { children: ReactNode; screenKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screenKey}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { gameOver, victory, inCombat, gameStarted, showReward, rewardType } = useGameStore();

  let screen: ReactNode = <MapComponent />;
  let screenKey = 'map';

  if (gameOver || victory) {
    screen = <GameOver />;
    screenKey = 'gameover';
  } else if (!gameStarted) {
    screen = <TeamSelect />;
    screenKey = 'team-select';
  } else if (showReward) {
    if (rewardType === 'rest') {
      screen = <RestSite />;
      screenKey = 'reward-rest';
    } else if (rewardType === 'combat' || rewardType === 'boss') {
      screen = <RewardScreen />;
      screenKey = `reward-${rewardType}`;
    } else if (rewardType === 'shop') {
      screen = <Shop />;
      screenKey = 'reward-shop';
    } else if (rewardType === 'event') {
      screen = <EventRoom />;
      screenKey = 'reward-event';
    } else if (rewardType === 'treasure') {
      screen = <TreasureRoom />;
      screenKey = 'reward-treasure';
    }
  } else if (inCombat) {
    screen = <Combat />;
    screenKey = 'combat';
  }

  return (
    <>
      <ScreenTransition screenKey={screenKey}>{screen}</ScreenTransition>
      <Toaster />
    </>
  );
}

export default App;
