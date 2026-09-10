import { RiskLevel } from '../types';

export const INITIAL_WALLET_BALANCE = 5.0;

export const BET_PRESETS = [0.10, 0.25, 0.50, 1.00, 5.00];

export const ROW_OPTIONS = [8, 10, 12, 14, 16] as const;

// Multiplier distributions for different row counts and risk profiles
// In Plinko, a board with N rows produces N + 1 bottom slots.
export const MULTIPLIERS_CONFIG: Record<RiskLevel, Record<number, number[]>> = {
  // Low Risk: more consistent returns, center multipliers ~1x, edges up to 16x-25x
  low: {
    8: [16, 9, 2, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 2, 9, 16].slice(2, 11), // 9 slots
    10: [16, 9, 3, 2, 1.5, 1.2, 1.1, 1, 1.1, 1.2, 1.5, 2, 3, 9, 16].slice(2, 13), // 11 slots
    12: [25, 12, 6, 3, 2, 1.4, 1.1, 1, 1.1, 1.4, 2, 3, 6, 12, 25].slice(1, 14), // 13 slots
    14: [35, 15, 7, 4, 2, 1.5, 1.2, 1, 0.8, 1, 1.2, 1.5, 2, 4, 7, 15, 35].slice(1, 16),
    16: [50, 16, 9, 4, 2.5, 1.7, 1.4, 1.1, 1, 1.1, 1.4, 1.7, 2.5, 4, 9, 16, 50],
  },
  // Medium Risk (Default): Classic Plinko style with 0.2x, 0.5x, 1x, 2x, 5x, 10x, 50x
  medium: {
    8: [50, 10, 4, 1.8, 0.5, 0.2, 0.5, 1.8, 4, 10, 50].slice(1, 10), // 9 slots: 10, 4, 1.8, 0.5, 0.2, 0.5, 1.8, 4, 10
    10: [50, 15, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 15, 50].slice(1, 12), // 11 slots: [50, 10, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 10, 50] (adjusted below)
    12: [110, 33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33, 110], // 13 slots
    14: [250, 60, 18, 7, 3, 1.6, 0.7, 0.2, 0.7, 1.6, 3, 7, 18, 60, 250], // 15 slots
    16: [500, 110, 25, 10, 5, 3, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 3, 5, 10, 25, 110, 500].slice(1, 18), // 17 slots
  },
  // High Risk: Massive edge multipliers (up to 1000x on 16 rows, or 50x-100x on 8-10 rows), with low center payouts (0.2x)
  high: {
    8: [50, 25, 9, 3, 0.5, 0.2, 0.5, 3, 9, 25, 50].slice(1, 10), // 9 slots: 25, 9, 3, 0.5, 0.2, 0.5, 3, 9, 25
    10: [76, 26, 9, 3, 1.5, 0.3, 0.2, 0.3, 1.5, 3, 9, 26, 76], // 11 slots
    12: [170, 45, 14, 5, 2, 0.7, 0.2, 0.7, 2, 5, 14, 45, 170], // 13 slots
    14: [420, 90, 28, 8, 3, 1, 0.2, 0.2, 0.2, 1, 3, 8, 28, 90, 420], // 15 slots
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000], // 17 slots
  }
};

// Ensure standard 8, 10, 12, 14, 16 rows have precise matching slot counts
// Fix Medium risk exact numbers to strictly match the user's prompt:
// "0.2x | 0.5x | 1x | 2x | 5x | 10x | 50x"
MULTIPLIERS_CONFIG.medium[8] = [50, 10, 5, 2, 0.5, 0.2, 0.5, 2, 5]; // 9 slots
MULTIPLIERS_CONFIG.medium[10] = [50, 10, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 10, 50].slice(1, 12); // 11 slots: [10, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 10]
MULTIPLIERS_CONFIG.high[8] = [50, 15, 5, 1.5, 0.2, 0.2, 1.5, 5, 15, 50].slice(0, 9);

export function getSlotColors(val: number) {
  if (val >= 50) {
    return {
      bg: 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)',
      border: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.8)',
      text: '#ffffff',
      pillBg: 'bg-rose-600 text-white border-rose-400',
    };
  } else if (val >= 10) {
    return {
      bg: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
      border: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.8)',
      text: '#000000',
      pillBg: 'bg-amber-500 text-black border-amber-300 font-bold',
    };
  } else if (val >= 5) {
    return {
      bg: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
      border: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.7)',
      text: '#000000',
      pillBg: 'bg-amber-600 text-white border-amber-400',
    };
  } else if (val >= 2) {
    return {
      bg: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
      border: '#10b981',
      glow: 'rgba(16, 185, 129, 0.7)',
      text: '#ffffff',
      pillBg: 'bg-emerald-600 text-white border-emerald-400',
    };
  } else if (val >= 1) {
    return {
      bg: 'linear-gradient(180deg, #06b6d4 0%, #0e7490 100%)',
      border: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.6)',
      text: '#ffffff',
      pillBg: 'bg-cyan-600 text-white border-cyan-400',
    };
  } else if (val >= 0.5) {
    return {
      bg: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
      border: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.5)',
      text: '#ffffff',
      pillBg: 'bg-purple-700 text-purple-200 border-purple-500',
    };
  } else {
    // 0.2x or lower
    return {
      bg: 'linear-gradient(180deg, #475569 0%, #1e293b 100%)',
      border: '#64748b',
      glow: 'rgba(100, 116, 139, 0.4)',
      text: '#94a3b8',
      pillBg: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  }
}
