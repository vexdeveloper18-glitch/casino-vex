import React from 'react';
import { GameRound } from '../types';
import { getSlotColors } from '../utils/constants';
import { History } from 'lucide-react';
import { motion } from 'motion/react';

interface RecentResultsProps {
  recentRounds: GameRound[];
  onSelectRound?: (round: GameRound) => void;
}

export const RecentResults: React.FC<RecentResultsProps> = ({
  recentRounds,
  onSelectRound,
}) => {
  return (
    <div className="w-full bg-[#0d0819] border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-3 overflow-hidden shadow-inner">
      <div className="flex items-center gap-1.5 pl-1 pr-2 text-xs font-bold text-amber-400/90 whitespace-nowrap border-r border-purple-900/60">
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Recent:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
        {recentRounds.length === 0 ? (
          <span className="text-xs text-slate-500 italic">No games played yet. Press PLAY to drop a ball!</span>
        ) : (
          recentRounds.slice(0, 16).map((round, idx) => {
            const colors = getSlotColors(round.multiplier);
            return (
              <motion.button
                key={round.id || idx}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectRound && onSelectRound(round)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black font-casino tracking-wide border shadow-sm transition-all hover:scale-110 active:scale-95 shrink-0 ${colors.pillBg}`}
                title={`Bet: $${round.betAmount.toFixed(2)} | Payout: $${round.payout.toFixed(2)} (${round.multiplier}x)`}
              >
                {round.multiplier}x
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};
