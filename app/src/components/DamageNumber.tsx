import { motion } from 'framer-motion';

interface DamageNumberProps {
  damage: number;
  isCrit?: boolean;
  isHeal?: boolean;
  x: number;
  y: number;
}

export function DamageNumber({ damage, isCrit = false, isHeal = false, x, y }: DamageNumberProps) {
  const getColor = () => {
    if (isHeal) return 'text-green-400';
    if (isCrit) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSymbol = () => {
    if (isHeal) return '+';
    return '-';
  };

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -80, scale: 1.5 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`
        absolute pointer-events-none font-bold text-4xl z-50
        ${getColor()}
        ${isCrit ? 'text-6xl' : ''}
      `}
      style={{ left: x, top: y }}
    >
      {getSymbol()}{damage}
    </motion.div>
  );
}
