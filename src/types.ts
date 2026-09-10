export type RiskLevel = 'low' | 'medium' | 'high';

export interface MultiplierSlot {
  index: number;
  value: number;
  color: string;
  glowColor: string;
  textColor: string;
  probability: number;
}

export interface GameRound {
  id: string;
  timestamp: number;
  betAmount: number;
  multiplier: number;
  payout: number;
  profit: number;
  slotIndex: number;
  riskLevel: RiskLevel;
  rows: number;
}

export interface GameStats {
  totalRounds: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  highestMultiplier: number;
  biggestWin: number;
}

export interface UserSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
  fastMode: boolean;
  autoPlayCount: number;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  betAmount: number;
  trail: { x: number; y: number; alpha: number }[];
  targetSlotIndex?: number;
  resolved: boolean;
  createdAt: number;
}

export interface Peg {
  x: number;
  y: number;
  radius: number;
  row: number;
  col: number;
  lastHitTime: number;
  glowIntensity: number;
}
