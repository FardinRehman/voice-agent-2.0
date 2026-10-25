import React, { useState, useEffect } from 'react';
import { IntegrationConfig } from '../types/banking.ts';
import {
  Server,
  Phone,
  Cpu,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Radio,
  FileCode,
  Lock,
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<{ target: string; message: string; success: boolean } | null>(null);
  const [testingTarget, setTestingTarget] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestIntegration = async (target: string) => {
    setTestingTarget(target);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      setTestResult({ target, message: data.message, success: data.success });
    } catch (err: any) {
      setTestResult({ target, message: err.message, success: false });
    } finally {
      setTestingTarget(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          System Integrations & Telephony Gateway
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Inspect and configure connections to Google Gemini Live API, SIP/PSTN Telephony Carriers, and Core Banking Systems.
        </p>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700/60 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>
              <strong>{testResult.target.toUpperCase()} Test:</strong> {testResult.message}
            </span>
          </div>
          <button onClick={() => setTestResult(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini Live API Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Google Gemini Live API
                  </h3>
                  <span className="text-[11px] text-slate-400">Real-Time Native Bidirectional Audio</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrations?.geminiLive.configured
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {integrations?.geminiLive.status || 'DISCONNECTED'}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Target Model:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">gemini-3.8-live</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Voice Persona:</span>
                <span className="font-medium">Kore (Warm Female Indian English)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Audio Protocols:</span>
                <span className="font-mono">In: 16kHz PCM LE • Out: 24kHz</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">VAD & Turn-Taking:</span>
                <span className="text-emerald-600 font-semibold">Active with Barge-in</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Server-side API key secured</span>
            <button
              onClick={() => handleTestIntegration('gemini')}
              disabled={testingTarget === 'gemini'}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingTarget === 'gemini' ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* SIP / PSTN Telephony Provider */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Telephony Carrier / SIP Gateway
                  </h3>
                  <span className="text-[11px] text-slate-400">PSTN Inbound Routing & TwiML Streams</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                SIMULATOR ACTIVE
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Hotline Number:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{integrations?.telephony.supportNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Webhook Path:</span>
                <span className="font-mono text-[11px]">{integrations?.telephony.inboundWebhookUrl}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Security Signature:</span>
                <span className="text-emerald-600 font-semibold">HMAC-SHA1 Verification</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status Callback:</span>
                <span className="font-mono text-[11px]">{integrations?.telephony.statusCallbackUrl}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Supports Twilio Media Streams & SIP</span>
            <button
              onClick={() => handleTestIntegration('telephony')}
              disabled={testingTarget === 'telephony'}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              Test Telephony Webhook
            </button>
          </div>
        </div>

        {/* Core Banking System Adapter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Core Banking System (CBS)
                  </h3>
                  <span className="text-[11px] text-slate-400">Ledger Balances, Transactions & Cards</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                HEALTHY
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Adapter Mode:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Synthetic In-Memory Store</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Database Transactions:</span>
                <span className="text-emerald-600 font-semibold">ACID Isolated</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Average Latency:</span>
                <span className="font-mono text-emerald-600 font-bold">&lt; 20ms</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Seeded with 12 synthetic customers</span>
            <button
              onClick={() => handleTestIntegration('core_banking')}
              disabled={testingTarget === 'core_banking'}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              Test CBS Bridge
            </button>
          </div>
        </div>

        {/* Identity & OTP Gateway */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Authentication & OTP Sandbox
                  </h3>
                  <span className="text-[11px] text-slate-400">2FA Second Factor Verification</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                READY
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Delivery Method:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Instant In-Memory Simulation</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Token Expiry:</span>
                <span className="font-mono">5 Minutes (Rolling)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Brute-Force Lockout:</span>
                <span className="text-emerald-600 font-semibold">Enabled (Max 3 retries)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">No real SMS delivery in simulator</span>
            <button
              onClick={() => handleTestIntegration('otp_gateway')}
              disabled={testingTarget === 'otp_gateway'}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              Test OTP Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
