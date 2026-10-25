import React from 'react';
import { Customer } from '../types/banking.ts';
import { Landmark, Shield, User, RefreshCw, Volume2, Sparkles, PhoneCall } from 'lucide-react';

interface HeaderProps {
  currentCustomer: Customer | null;
  onOpenCustomerPicker: () => void;
  onResetData: () => void;
  volume: number;
  onChangeVolume: (v: number) => void;
  onTestVoice: () => void;
  isTestingVoice: boolean;
  onNavigateToSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCustomer,
  onOpenCustomerPicker,
  onResetData,
  volume,
  onChangeVolume,
  onTestVoice,
  isTestingVoice,
  onNavigateToSimulator,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a192f] border-b border-slate-800 text-white shadow-md">
      {/* Top Notification / Mode Banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1 text-center flex items-center justify-center gap-2 text-xs font-medium text-amber-300">
        <Shield className="w-3.5 h-3.5" />
        <span>SIMULATION MODE — SYNTHETIC DATA ONLY. NO REAL MONEY OR ACTUAL BANK ACCOUNTS ARE LINKED.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white">XYZ BANK</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI VOICE AGENT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Telephony Customer Support • Ananya</p>
          </div>
        </div>

        {/* Center / Action Controls */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Active Customer Selector */}
          <button
            onClick={onOpenCustomerPicker}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors"
            title="Switch Simulated Customer"
          >
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block font-semibold text-white truncate max-w-[120px]">
                {currentCustomer?.name || 'Select Customer'}
              </span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {currentCustomer?.maskedPhone || 'No Phone'}
              </span>
            </div>
            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-1">Change</span>
          </button>

          {/* Speaker Volume Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/70 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              title="Speaker Output Volume"
            />
            <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Voice Preview Test */}
          <button
            onClick={onTestVoice}
            disabled={isTestingVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition-colors"
            title="Listen to sample audio of Ananya's Indian-accented voice"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTestingVoice ? 'animate-spin' : ''}`} />
            <span>{isTestingVoice ? 'Synthesizing...' : 'Test Ananya Voice'}</span>
          </button>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onResetData}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            title="Reset Simulated Database to Default Seed Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={onNavigateToSimulator}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>Voice Simulator</span>
          </button>
        </div>
      </div>
    </header>
  );
};
