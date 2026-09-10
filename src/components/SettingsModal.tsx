import React from 'react';
import { X, Volume2, Zap, RotateCcw, Trash2, Check } from 'lucide-react';
import { UserSettings } from '../types';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetWallet: () => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetWallet,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#130d25] border-2 border-amber-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-5 text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-purple-900/50 pb-3">
          <h2 className="text-lg font-bold font-casino tracking-wider text-amber-300 flex items-center gap-2">
            GAME SETTINGS
          </h2>
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

        {/* Audio Volume */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Sound Effects
            </span>
            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                sound.setEnabled(next);
                onUpdateSettings({ soundEnabled: next });
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                settings.soundEnabled
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                sound.setVolume(val);
                onUpdateSettings({ soundVolume: val });
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 rounded-lg bg-slate-700"
            />
            <span className="text-xs font-bold text-slate-400 w-10 text-right">
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Fast Mode */}
        <div className="flex items-center justify-between py-2 border-t border-purple-900/40">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-300 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-cyan-400" />
              Fast Drop Mode
            </span>
            <span className="text-xs text-slate-400">Accelerates ball gravity and physics</span>
          </div>
          <button
            onClick={() => {
              sound.playButtonClick();
              onUpdateSettings({ fastMode: !settings.fastMode });
            }}
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
              settings.fastMode ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Balance Refill / Reset */}
        <div className="pt-2 border-t border-purple-900/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Reset Wallet to $5.00
              </span>
              <span className="text-xs text-slate-400">Restore your starting $5.00 casino chips</span>
            </div>
            <button
              onClick={() => {
                sound.playButtonClick();
                onResetWallet();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-all active:scale-95 shadow-md"
            >
              Reset ($5.00)
            </button>
          </div>
        </div>

        {/* Clear History */}
        <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Clear Game History
            </span>
            <span className="text-xs text-slate-400">Erase past rounds and performance stats</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your game history?')) {
                sound.playButtonClick();
                onClearHistory();
              }
            }}
            className="px-3 py-1.5 text-xs font-bold bg-rose-900/50 hover:bg-rose-900 text-rose-200 border border-rose-700/50 rounded-lg transition-colors"
          >
            Clear Data
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            sound.playButtonClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2"
        >
          <Check className="w-4 h-4" />
          Done
        </button>
      </div>
    </div>
  );
};
