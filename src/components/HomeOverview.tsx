import React from 'react';
import { Customer } from '../types/banking.ts';
import {
  PhoneCall,
  ShieldCheck,
  Zap,
  Globe,
  Mic,
  Volume2,
  Lock,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Building,
  CreditCard,
  Layers,
} from 'lucide-react';

interface HomeOverviewProps {
  onNavigateToSimulator: () => void;
  onOpenCustomerPicker: () => void;
  currentCustomer: Customer | null;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  onNavigateToSimulator,
  onOpenCustomerPicker,
  currentCustomer,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0a192f] via-slate-900 to-blue-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>NATIVE BIDIRECTIONAL AUDIO • 100% HANDS-FREE TELEPHONY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Next-Generation AI Voice Banking for <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">XYZ Bank</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Meet <strong>Ananya</strong>, your virtual voice banking assistant. Experience natural telephone conversation with live voice activity detection (VAD), authentic Indian English and regional language adaptation, seamless barge-in interruption, and real backend tool execution.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onNavigateToSimulator}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Launch Voice Simulator</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onOpenCustomerPicker}
              className="px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <span>Current Customer: <strong className="text-teal-300">{currentCustomer?.name}</strong></span>
              <span className="text-slate-400 font-normal underline">Change</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-blue-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Zero Send-Button Interaction
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Continuously streams speech through Gemini Live API. Advanced voice activity detection detects when you finish speaking, automatically answers aloud, and yields whenever you interrupt.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-blue-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            21+ Real Banking Tools
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            The AI executes real backend tools for balance inquiries, card blocking/unblocking, transaction queries, branch locator, and complaint tickets rather than hallucinating answers.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-blue-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Indian Multilingual Fluency
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            Ananya speaks with an authentic, respectful Indian English accent, seamlessly code-switches into Hindi, Kannada, Telugu, Tamil, Marathi, and preserves financial precision across all languages.
          </p>
        </div>
      </div>

      {/* Acceptance Test Walkthrough Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Automated Acceptance Test Walkthrough
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Experience the Telephone Conversation Loop
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Follow these exact test steps in the Voice Simulator to verify real-time voice recognition and tool invocation:
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Step 1: Balance Inquiry</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-7">
              Say: <em>"Hello, I want to know my account balance."</em> Stop speaking. The agent asks to verify your identity, reads the 6-digit OTP, retrieves your real balance, and speaks it aloud.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Step 2: Card Blocking</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-7">
              Say: <em>"Also, block my debit card."</em> The agent identifies your card, asks for confirmation, executes the <code className="font-mono text-blue-600">block_card</code> tool, and reports the actual result.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
