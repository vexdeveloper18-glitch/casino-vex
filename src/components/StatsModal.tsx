import React from 'react';
import { X, Trophy, DollarSign, TrendingUp, Activity, Award } from 'lucide-react';
import { GameRound, GameStats } from '../types';
import { getSlotColors } from '../utils/constants';
import { sound } from '../utils/audio';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  history: GameRound[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  history,
}) => {
  if (!isOpen) return null;

  const winRate = stats.totalRounds > 0
    ? (history.filter((h) => h.multiplier >= 1).length / stats.totalRounds) * 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#120b22] border-2 border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-white overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black font-casino tracking-wider text-amber-300">
              GAME STATISTICS & HISTORY
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-[#20153d] hover:bg-[#2e1f54] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-[#1a1130] border border-purple-900/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Rounds Played
            </span>
            <span className="text-xl font-black text-white font-casino mt-1">{stats.totalRounds}</span>
          </div>

          <div className="bg-[#1a1130] border border-purple-900/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Total Wagered
            </span>
            <span className="text-xl font-black text-amber-400 font-casino mt-1">${stats.totalWagered.toFixed(2)}</span>
          </div>

          <div className="bg-[#1a1130] border border-purple-900/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Net Profit
            </span>
            <span
              className={`text-xl font-black font-casino mt-1 ${
                stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#1a1130] border border-purple-900/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Best Multiplier
            </span>
            <span className="text-xl font-black text-amber-300 font-casino mt-1">{stats.highestMultiplier}x</span>
          </div>

          <div className="bg-[#1a1130] border border-purple-900/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Biggest Win
            </span>
            <span className="text-xl font-black text-emerald-400 font-casino mt-1">${stats.biggestWin.toFixed(2)}</span>
          </div>

          <div className="bg-[#1a1130] border border-purple-900/40 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Win Rate (≥1x)
            </span>
            <span className="text-xl font-black text-purple-300 font-casino mt-1">{winRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 min-h-0 flex flex-col mt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Historical Rounds ({history.length})
          </h3>

          <div className="flex-1 overflow-y-auto border border-purple-900/40 rounded-xl bg-[#0b0617]">
            {history.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 italic">
                No game history yet. Play rounds to view your results here!
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#160e2c] text-slate-300 font-bold border-b border-purple-900/60 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Bet</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Payout</th>
                    <th className="py-2.5 px-3">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/60 font-medium text-slate-300">
                  {history.map((round) => {
                    const colors = getSlotColors(round.multiplier);
                    const timeStr = new Date(round.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                    return (
                      <tr key={round.id} className="hover:bg-purple-950/30 transition-colors">
                        <td className="py-2 px-3 text-slate-400">{timeStr}</td>
                        <td className="py-2 px-3 font-casino text-amber-300">${round.betAmount.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-black font-casino border ${colors.pillBg}`}
                          >
                            {round.multiplier}x
                          </span>
                        </td>
                        <td className="py-2 px-3 font-casino font-bold text-white">${round.payout.toFixed(2)}</td>
                        <td
                          className={`py-2 px-3 font-casino font-bold ${
                            round.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {round.profit >= 0 ? '+' : ''}${round.profit.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
