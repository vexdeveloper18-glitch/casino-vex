import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Settings, BarChart3, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../utils/audio';

interface HeaderProps {
  walletBalance: number;
  lastPayout: { amount: number; multiplier: number; id: string } | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onResetWallet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletBalance,
  lastPayout,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenStats,
  onResetWallet,
}) => {
  const [displayBalance, setDisplayBalance] = useState(walletBalance);

  // Smooth numeric counter animation
  useEffect(() => {
    let start = displayBalance;
    const end = walletBalance;
    if (Math.abs(start - end) < 0.01) {
      setDisplayBalance(end);
      return;
    }

    const duration = 400; // ms
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayBalance(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayBalance(end);
      }
    };

    const frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [walletBalance]);

  return (
    <header className="w-full bg-[#0d0918]/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-3 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 p-[1.5px] shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-[#120b22] rounded-[10px] flex items-center justify-center">
              <span className="text-xl font-black text-amber-400 font-casino tracking-wider">P</span>
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-xl font-extrabold tracking-wider text-white font-casino flex items-center gap-1">
                PLINKO <span className="gold-gradient-text font-black">CASINO</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Provably Fair • Instant Multipliers
            </p>
          </div>
        </div>

        {/* Center: WALLET BALANCE (Clearly displayed at the top) */}
        <div className="flex items-center gap-2">
          <div
            id="wallet-balance-display"
            className="relative px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl bg-gradient-to-b from-[#1c1333] to-[#120b22] border-2 border-amber-400/60 shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center gap-3"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase font-bold text-amber-300/80 tracking-widest leading-none">
                Wallet Balance
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-bold text-amber-400">$</span>
                <span className="text-xl sm:text-2xl font-black text-white font-casino tracking-wider tabular-nums">
                  {displayBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick reset / Refill if low */}
            {walletBalance < 0.10 && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => {
                  sound.playButtonClick();
                  onResetWallet();
                }}
                className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors shadow-sm flex items-center gap-1"
                title="Reset balance to $5.00"
              >
                <RotateCcw className="w-3 h-3" />
                Refill
              </motion.button>
            )}

            {/* Floating payout popup badge */}
            <AnimatePresence>
              {lastPayout && lastPayout.amount > 0 && (
                <motion.div
                  key={lastPayout.id}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -28, scale: 1 }}
                  exit={{ opacity: 0, y: -40, scale: 0.8 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute left-1/2 -translate-x-1/2 -top-1 pointer-events-none px-3 py-0.5 rounded-full bg-emerald-500 text-black font-black text-xs sm:text-sm font-casino shadow-[0_0_15px_rgba(16,185,129,0.8)] flex items-center gap-1 whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" />
                  +${lastPayout.amount.toFixed(2)} ({lastPayout.multiplier}x)
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Controls: Audio, Stats, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            id="btn-sound-toggle"
            onClick={() => {
              sound.playButtonClick();
              onToggleSound();
            }}
            className="w-9 h-9 rounded-lg bg-[#1a1230] hover:bg-[#251a44] border border-amber-500/20 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Statistics Modal Button */}
          <button
            id="btn-stats-modal"
            onClick={() => {
              sound.playButtonClick();
              onOpenStats();
            }}
            className="w-9 h-9 rounded-lg bg-[#1a1230] hover:bg-[#251a44] border border-amber-500/20 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors"
            title="Game Stats & History"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            id="btn-settings-modal"
            onClick={() => {
              sound.playButtonClick();
              onOpenSettings();
            }}
            className="w-9 h-9 rounded-lg bg-[#1a1230] hover:bg-[#251a44] border border-amber-500/20 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors"
            title="Game Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
