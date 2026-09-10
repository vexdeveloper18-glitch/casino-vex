import React, { useState } from 'react';
import { Play, Flame, Shield, Zap, RefreshCw, Layers } from 'lucide-react';
import { RiskLevel } from '../types';
import { BET_PRESETS, ROW_OPTIONS } from '../utils/constants';
import { sound } from '../utils/audio';

interface BettingControlsProps {
  walletBalance: number;
  betAmount: number;
  onBetChange: (amount: number) => void;
  onPlay: () => void;
  isPlaying: boolean;
  activeBallCount: number;
  riskLevel: RiskLevel;
  onRiskChange: (risk: RiskLevel) => void;
  rows: number;
  onRowsChange: (rows: number) => void;
  autoPlayActive: boolean;
  onToggleAutoPlay: (count: number) => void;
  autoRemaining: number;
}

export const BettingControls: React.FC<BettingControlsProps> = ({
  walletBalance,
  betAmount,
  onBetChange,
  onPlay,
  isPlaying,
  activeBallCount,
  riskLevel,
  onRiskChange,
  rows,
  onRowsChange,
  autoPlayActive,
  onToggleAutoPlay,
  autoRemaining,
}) => {
  const [autoCountSelect, setAutoCountSelect] = useState<number>(10);

  const canPlay = walletBalance >= betAmount && betAmount >= 0.10;

  const handlePresetClick = (amount: number) => {
    sound.playChipClick();
    onBetChange(Math.min(walletBalance > 0 ? walletBalance : 5, amount));
  };

  const handleHalf = () => {
    sound.playChipClick();
    const newBet = Math.max(0.10, Number((betAmount / 2).toFixed(2)));
    onBetChange(newBet);
  };

  const handleDouble = () => {
    sound.playChipClick();
    const newBet = Math.min(walletBalance > 0 ? walletBalance : 50, Number((betAmount * 2).toFixed(2)));
    onBetChange(newBet);
  };

  const handleMin = () => {
    sound.playChipClick();
    onBetChange(0.10);
  };

  const handleMax = () => {
    sound.playChipClick();
    if (walletBalance > 0) {
      onBetChange(Number(walletBalance.toFixed(2)));
    }
  };

  return (
    <div className="w-full bg-[#110b22] border border-amber-500/25 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      {/* Bet Amount Header & Custom Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Bet Amount ($)
          </label>
          <span className="text-[11px] text-slate-400">
            Min: $0.10 • Max: ${Math.max(5, walletBalance).toFixed(2)}
          </span>
        </div>

        <div className="relative flex items-center rounded-xl bg-[#090514] border-2 border-amber-500/30 focus-within:border-amber-400 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">
          <span className="pl-3.5 pr-1 text-lg font-black text-amber-400 font-casino">$</span>
          <input
            type="number"
            step="0.05"
            min="0.10"
            max={Math.max(50, walletBalance)}
            value={betAmount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onBetChange(Number(val.toFixed(2)));
              } else {
                onBetChange(0);
              }
            }}
            className="w-full bg-transparent py-2.5 px-2 text-lg font-black text-white font-casino focus:outline-none tabular-nums"
          />

          {/* Quick 1/2, 2x, Min, Max controls */}
          <div className="flex items-center gap-1 pr-2">
            <button
              onClick={handleHalf}
              className="px-2 py-1 text-xs font-bold rounded bg-[#1f1538] hover:bg-[#2e2050] text-slate-300 hover:text-white border border-purple-500/20 transition-all active:scale-95"
            >
              ½
            </button>
            <button
              onClick={handleDouble}
              className="px-2 py-1 text-xs font-bold rounded bg-[#1f1538] hover:bg-[#2e2050] text-slate-300 hover:text-white border border-purple-500/20 transition-all active:scale-95"
            >
              2×
            </button>
            <button
              onClick={handleMin}
              className="px-2 py-1 text-xs font-bold rounded bg-[#1f1538] hover:bg-[#2e2050] text-slate-300 hover:text-white border border-purple-500/20 transition-all active:scale-95"
            >
              Min
            </button>
            <button
              onClick={handleMax}
              className="px-2 py-1 text-xs font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all active:scale-95"
            >
              Max
            </button>
          </div>
        </div>
      </div>

      {/* Preset Chips ($0.10, $0.25, $0.50, $1.00, $5.00) */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
          Quick Chips
        </span>
        <div className="grid grid-cols-5 gap-2">
          {BET_PRESETS.map((preset) => {
            const isSelected = Math.abs(betAmount - preset) < 0.001;
            return (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.6)] ring-2 ring-white scale-105'
                    : 'bg-[#180f2d] hover:bg-[#241744] text-slate-200 border border-amber-500/20 hover:border-amber-400/40'
                }`}
              >
                {/* Chip border styling */}
                <span className="text-[9px] font-bold opacity-75 leading-tight">CHIP</span>
                <span className="text-xs sm:text-sm font-black font-casino tracking-wide">
                  ${preset >= 1 ? preset.toFixed(0) : preset.toFixed(2).replace('0.', '.')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk & Rows Controls */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-900/40">
        {/* Risk Level */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1.5 uppercase tracking-wider">
            {riskLevel === 'high' ? (
              <Flame className="w-3.5 h-3.5 text-rose-500" />
            ) : riskLevel === 'medium' ? (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Risk
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#090514] p-1 rounded-xl border border-purple-900/60">
            {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.playButtonClick();
                  onRiskChange(r);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  riskLevel === r
                    ? r === 'high'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : r === 'medium'
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Rows Count */}
        <div>
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1.5 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Rows
          </label>
          <div className="flex items-center justify-between bg-[#090514] p-1 rounded-xl border border-purple-900/60">
            {ROW_OPTIONS.map((num) => (
              <button
                key={num}
                onClick={() => {
                  sound.playButtonClick();
                  onRowsChange(num);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  rows === num
                    ? 'bg-cyan-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auto Play Selector */}
      <div className="flex items-center justify-between bg-[#0a0517] p-2.5 rounded-xl border border-purple-900/40">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${autoPlayActive ? 'animate-spin' : ''}`} />
          <span className="text-xs font-bold text-slate-300">Auto Play</span>
        </div>

        {!autoPlayActive ? (
          <div className="flex items-center gap-1.5">
            {[5, 10, 25].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setAutoCountSelect(cnt)}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  autoCountSelect === cnt
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cnt}
              </button>
            ))}
            <button
              onClick={() => onToggleAutoPlay(autoCountSelect)}
              disabled={!canPlay}
              className="px-3 py-1 text-xs font-extrabold bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-40"
            >
              START
            </button>
          </div>
        ) : (
          <button
            onClick={() => onToggleAutoPlay(0)}
            className="px-3 py-1 text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-sm animate-pulse"
          >
            STOP ({autoRemaining} left)
          </button>
        )}
      </div>

      {/* MAIN PLAY BUTTON */}
      <div className="relative pt-1">
        <button
          id="btn-play-plinko"
          disabled={!canPlay && !autoPlayActive}
          onClick={() => {
            if (canPlay) {
              sound.playBallDrop();
              onPlay();
            }
          }}
          className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-lg sm:text-xl font-casino tracking-wider flex items-center justify-center gap-2.5 transition-all duration-150 uppercase select-none ${
            canPlay
              ? 'btn-gold text-stone-900 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>PLAY (${betAmount.toFixed(2)})</span>
          {activeBallCount > 0 && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-200">
              {activeBallCount} active
            </span>
          )}
        </button>

        {walletBalance < betAmount && (
          <p className="text-center text-[11px] text-rose-400 font-medium mt-1.5">
            Insufficient balance. Please reduce your bet or click Refill.
          </p>
        )}
      </div>
    </div>
  );
};
