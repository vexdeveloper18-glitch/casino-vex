import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { PlinkoBoard } from './components/PlinkoBoard';
import { BettingControls } from './components/BettingControls';
import { RecentResults } from './components/RecentResults';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { Ball, GameRound, GameStats, RiskLevel, UserSettings } from './types';
import { INITIAL_WALLET_BALANCE } from './utils/constants';
import { sound } from './utils/audio';

export default function App() {
  // --- Local Storage Initialization ---
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('plinko_wallet_balance');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_WALLET_BALANCE;
  });

  const [betAmount, setBetAmount] = useState<number>(0.50);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  const [rows, setRows] = useState<number>(8);

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('plinko_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      soundEnabled: true,
      soundVolume: 0.6,
      fastMode: false,
      autoPlayCount: 10,
    };
  });

  const [history, setHistory] = useState<GameRound[]>(() => {
    try {
      const saved = localStorage.getItem('plinko_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('plinko_stats');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      totalRounds: 0,
      totalWagered: 0,
      totalWon: 0,
      netProfit: 0,
      highestMultiplier: 0,
      biggestWin: 0,
    };
  });

  // --- Active State ---
  const [activeBalls, setActiveBalls] = useState<Ball[]>([]);
  const [lastPayout, setLastPayout] = useState<{ amount: number; multiplier: number; id: string } | null>(null);
  const [highlightedSlot, setHighlightedSlot] = useState<{ index: number; time: number } | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Auto play
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const [autoRemaining, setAutoRemaining] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound settings with audio manager on mount
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    sound.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Persist wallet
  useEffect(() => {
    try {
      localStorage.setItem('plinko_wallet_balance', walletBalance.toFixed(2));
    } catch {
      // ignore
    }
  }, [walletBalance]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('plinko_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist history & stats
  useEffect(() => {
    try {
      localStorage.setItem('plinko_history', JSON.stringify(history.slice(0, 100)));
      localStorage.setItem('plinko_stats', JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [history, stats]);

  // Remove ball helper
  const handleRemoveBall = useCallback((ballId: string) => {
    setActiveBalls((prev) => prev.filter((b) => b.id !== ballId));
  }, []);

  // Handle ball landed in bottom multiplier slot
  const handleBallLanded = useCallback(
    (multiplier: number, landedBetAmount: number, slotIndex: number) => {
      const payout = Number((landedBetAmount * multiplier).toFixed(2));
      const profit = Number((payout - landedBetAmount).toFixed(2));

      // 1. Immediately update wallet balance
      setWalletBalance((prev) => Number((prev + payout).toFixed(2)));

      // 2. Trigger floating notification in Header
      setLastPayout({
        amount: payout,
        multiplier,
        id: `payout-${Date.now()}-${Math.random()}`,
      });

      // 3. Highlight slot
      setHighlightedSlot({ index: slotIndex, time: performance.now() });

      // 4. Big win celebration (Confetti!)
      if (multiplier >= 10) {
        try {
          confetti({
            particleCount: multiplier >= 50 ? 100 : 50,
            spread: multiplier >= 50 ? 90 : 60,
            origin: { y: 0.75 },
            colors: ['#D4AF37', '#F59E0B', '#10B981', '#EC4899', '#38BDF8'],
          });
        } catch {
          // ignore
        }
      }

      // 5. Record round in history
      const newRound: GameRound = {
        id: `round-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        betAmount: landedBetAmount,
        multiplier,
        payout,
        profit,
        slotIndex,
        riskLevel,
        rows,
      };

      setHistory((prev) => [newRound, ...prev]);

      // 6. Update lifetime stats
      setStats((prev) => ({
        totalRounds: prev.totalRounds + 1,
        totalWagered: Number((prev.totalWagered + landedBetAmount).toFixed(2)),
        totalWon: Number((prev.totalWon + payout).toFixed(2)),
        netProfit: Number((prev.netProfit + profit).toFixed(2)),
        highestMultiplier: Math.max(prev.highestMultiplier, multiplier),
        biggestWin: Math.max(prev.biggestWin, payout),
      }));
    },
    [riskLevel, rows]
  );

  // Drop a ball
  const handlePlay = useCallback(() => {
    if (walletBalance < betAmount || betAmount < 0.10) {
      if (autoPlayActive) {
        setAutoPlayActive(false);
        setAutoRemaining(0);
      }
      return;
    }

    // Deduct bet immediately from wallet
    setWalletBalance((prev) => Number((prev - betAmount).toFixed(2)));

    // Create new ball with slight random drop jitter
    const container = document.getElementById('plinko-canvas-container');
    const width = container ? container.clientWidth : 680;
    const centerX = width / 2;

    const jitter = (Math.random() - 0.5) * 5; // tiny horizontal drop variance
    const newBall: Ball = {
      id: `ball-${Date.now()}-${Math.random()}`,
      x: centerX + jitter,
      y: 18,
      vx: (Math.random() - 0.5) * 0.8,
      vy: settings.fastMode ? 3.0 : 1.8,
      radius: 7.5,
      color: '#F59E0B',
      betAmount: betAmount,
      trail: [],
      resolved: false,
      createdAt: Date.now(),
    };

    setActiveBalls((prev) => [...prev, newBall]);
  }, [walletBalance, betAmount, autoPlayActive, settings.fastMode]);

  // Spacebar keyboard listener to trigger PLAY
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        isSettingsOpen ||
        isStatsOpen
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlay, isSettingsOpen, isStatsOpen]);

  // Auto play logic
  const handleToggleAutoPlay = (count: number) => {
    sound.playButtonClick();
    if (autoPlayActive || count === 0) {
      setAutoPlayActive(false);
      setAutoRemaining(0);
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    } else {
      setAutoPlayActive(true);
      setAutoRemaining(count);
    }
  };

  useEffect(() => {
    if (!autoPlayActive) {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      return;
    }

    if (autoRemaining <= 0 || walletBalance < betAmount) {
      setAutoPlayActive(false);
      setAutoRemaining(0);
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      return;
    }

    // Drop immediately
    handlePlay();
    setAutoRemaining((r) => r - 1);

    const intervalTime = settings.fastMode ? 350 : 550;
    autoPlayTimerRef.current = setInterval(() => {
      setAutoRemaining((prev) => {
        if (prev <= 1) {
          setAutoPlayActive(false);
          if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
          return 0;
        }
        handlePlay();
        return prev - 1;
      });
    }, intervalTime);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlayActive, settings.fastMode]);

  // Reset wallet helper
  const handleResetWallet = () => {
    setWalletBalance(INITIAL_WALLET_BALANCE);
    setBetAmount(0.50);
  };

  // Clear history helper
  const handleClearHistory = () => {
    setHistory([]);
    setStats({
      totalRounds: 0,
      totalWagered: 0,
      totalWon: 0,
      netProfit: 0,
      highestMultiplier: 0,
      biggestWin: 0,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#080512] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,58,237,0.18),rgba(255,255,255,0))] text-white flex flex-col justify-between">
      {/* Top Navigation / Header with Wallet Balance & Global Controls */}
      <Header
        walletBalance={walletBalance}
        lastPayout={lastPayout}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onResetWallet={handleResetWallet}
      />

      {/* Main Game Stage (16:9 Desktop Frame & Responsive on Mobile) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
        {/* Recent landed multipliers ticker */}
        <RecentResults
          recentRounds={history}
          onSelectRound={() => setIsStatsOpen(true)}
        />

        {/* 16:9 Container on Desktop, Responsive Stack on Mobile */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column: Betting & Game Parameters Controls (lg:col-span-4) */}
          <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col justify-center">
            <BettingControls
              walletBalance={walletBalance}
              betAmount={betAmount}
              onBetChange={(amt) => setBetAmount(amt)}
              onPlay={handlePlay}
              isPlaying={activeBalls.length > 0}
              activeBallCount={activeBalls.length}
              riskLevel={riskLevel}
              onRiskChange={setRiskLevel}
              rows={rows}
              onRowsChange={setRows}
              autoPlayActive={autoPlayActive}
              onToggleAutoPlay={handleToggleAutoPlay}
              autoRemaining={autoRemaining}
            />
          </div>

          {/* Right Column: Plinko Canvas Board (lg:col-span-8) */}
          <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]">
            <div className="relative w-full h-full flex-1 rounded-2xl p-1 bg-gradient-to-b from-amber-500/30 via-purple-900/20 to-amber-500/10 shadow-[0_0_30px_rgba(0,0,0,0.7)]">
              <PlinkoBoard
                rows={rows}
                riskLevel={riskLevel}
                fastMode={settings.fastMode}
                onBallLanded={handleBallLanded}
                activeBalls={activeBalls}
                onRemoveBall={handleRemoveBall}
                highlightedSlot={highlightedSlot}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info / Hotkey bar */}
      <footer className="w-full border-t border-purple-950/60 bg-[#07040f] py-2.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-slate-300 font-mono text-[10px]">SPACEBAR</kbd> to drop a ball instantly</span>
          <span className="text-amber-400/70 font-semibold font-casino tracking-wider">CASINO FAIR RANDOMNESS</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
        onResetWallet={handleResetWallet}
        onClearHistory={handleClearHistory}
      />

      {/* Statistics & History Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        history={history}
      />
    </div>
  );
}
