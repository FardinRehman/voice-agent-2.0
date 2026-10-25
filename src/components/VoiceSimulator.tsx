import React, { useState, useEffect, useRef } from 'react';
import { Customer, TranscriptItem, ToolExecution } from '../types/banking.ts';
import { AudioRecorder, GaplessAudioPlayer } from '../utils/audioUtils.ts';
import { AudioVisualizer } from './AudioVisualizer.tsx';
import { formatDuration } from '../utils/formatters.ts';
import { BrowserVoiceSession } from '../utils/browserVoiceSession.ts';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Zap,
  Globe,
  Radio,
  Copy,
  Check,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface VoiceSimulatorProps {
  currentCustomer: Customer | null;
  onOpenCustomerPicker: () => void;
  speakerVolume: number;
  onCallEnded?: () => void;
}

export const VoiceSimulator: React.FC<VoiceSimulatorProps> = ({
  currentCustomer,
  onOpenCustomerPicker,
  speakerVolume,
  onCallEnded,
}) => {
  // Call Lifecycle state
  const [callState, setCallState] = useState<'IDLE' | 'CONNECTING' | 'ACTIVE' | 'ERROR'>('IDLE');
  const [callId, setCallId] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio / Interaction state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState<boolean>(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  // Language & Persona settings
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Auto Detect');

  // Real-time transcript & active tools
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [activeTool, setActiveTool] = useState<{ name: string; args: any; status: 'EXECUTING' | 'SUCCESS' | 'FAILED' } | null>(null);
  const [toolHistory, setToolHistory] = useState<ToolExecution[]>([]);

  // Simulation OTP helper
  const [activeOtp, setActiveOtp] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // References for WebAudio and WebSocket
  const wsRef = useRef<WebSocket | BrowserVoiceSession | null>(null);
  const speechRecRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<GaplessAudioPlayer | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Update player volume whenever prop changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(speakerVolume);
    }
  }, [speakerVolume]);

  // Scroll transcript to bottom automatically
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, isProcessing, activeTool]);

  // Poll for active simulated OTP for the current customer
  useEffect(() => {
    let interval: any;
    if (callState === 'ACTIVE' && currentCustomer) {
      const fetchOtp = async () => {
        try {
          const res = await fetch(`/api/otp/active/${currentCustomer.id}`);
          const data = await res.json();
          if (data.otp) {
            setActiveOtp(data.otp);
          }
        } catch {}
      };
      fetchOtp();
      interval = setInterval(fetchOtp, 2000);
    } else {
      setActiveOtp(null);
    }
    return () => clearInterval(interval);
  }, [callState, currentCustomer]);

  // Handle call duration timer
  useEffect(() => {
    if (callState === 'ACTIVE') {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  // Start hands-free voice call
  const startCall = async () => {
    try {
      setErrorMessage(null);
      setMicPermissionDenied(false);
      setCallState('CONNECTING');
      setCallDuration(0);
      setTranscripts([]);
      setToolHistory([]);
      setActiveTool(null);

      // 1. Initialize Player at 24kHz
      const player = new GaplessAudioPlayer((speaking) => {
        setIsAgentSpeaking(speaking);
        if (speaking) {
          setIsProcessing(false);
        }
      });
      player.setVolume(speakerVolume);
      playerRef.current = player;

      // 2. Register call session on server
      const newCallId = `CALL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      setCallId(newCallId);

      const customerPhone = currentCustomer?.phone || '+91 98765 43210';
      await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerNumber: customerPhone,
          mode: 'SIMULATION',
          customerId: currentCustomer?.id,
        }),
      });

      // 3. Establish WebSocket connection to backend Gemini Live Bridge (or BrowserVoiceSession for GitHub Pages)
      const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
      let ws: any;

      if (isGitHubPages) {
        ws = new BrowserVoiceSession(newCallId, customerPhone, currentCustomer?.id);
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live?callId=${newCallId}&caller=${encodeURIComponent(
          customerPhone
        )}&customerId=${currentCustomer?.id || ''}`;
        ws = new WebSocket(wsUrl);
      }
      wsRef.current = ws;

      ws.onopen = async () => {
        // 4. Start continuous hands-free audio recording with VAD
        try {
          const recorder = new AudioRecorder();
          await recorder.start(
            // On audio chunk (16kHz PCM LE base64)
            (base64Audio) => {
              if (ws.readyState === 1 && !isMuted) {
                ws.send(JSON.stringify({ type: 'audio', audio: base64Audio }));
              }
            },
            // On user speaking state changed (speech started/stopped)
            (isSpeaking) => {
              setIsCustomerSpeaking(isSpeaking);
              if (isSpeaking) {
                // Customer started speaking: Barge-in / Interruption handling!
                if (playerRef.current) {
                  playerRef.current.stopAndClearQueue();
                }
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsAgentSpeaking(false);
              }
            },
            // On speech-end detected (silence threshold reached)
            () => {
              setIsCustomerSpeaking(false);
              setIsProcessing(true);
            },
            // On mic RMS volume for visualizer
            (vol) => {
              setMicVolume(vol);
            }
          );

          recorderRef.current = recorder;
          setCallState('ACTIVE');

          // If on GitHub Pages, also listen with Web Speech API for hands-free speech recognition
          if (isGitHubPages && typeof window !== 'undefined') {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
              try {
                const rec = new SpeechRec();
                rec.continuous = true;
                rec.interimResults = false;
                rec.lang = currentCustomer?.preferredLanguage === 'Hindi' ? 'hi-IN' : 'en-IN';
                rec.onresult = (e: any) => {
                  const lastIdx = e.results.length - 1;
                  const spokenText = e.results[lastIdx][0]?.transcript;
                  if (spokenText) {
                    triggerSimulatedSpeech(spokenText.trim());
                  }
                };
                rec.start();
                speechRecRef.current = rec;
              } catch (e) {
                console.warn('SpeechRecognition error:', e);
              }
            }
          }

          // Initial greeting transcript
          setTranscripts([
            {
              id: 'tr-sys-1',
              speaker: 'system',
              text: `Call connected to XYZ Bank AI Voice Support. Speaking with Ananya in ${currentCustomer?.preferredLanguage || 'Indian English'}.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        } catch (micErr: any) {
          console.error('Microphone error:', micErr);
          setMicPermissionDenied(true);
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser to speak hands-free.');
          setCallState('ERROR');
          endCall();
        }
      };

      ws.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.audio) {
            // Stream audio response through GaplessAudioPlayer
            playerRef.current?.playChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            // Server detected customer barge-in
            playerRef.current?.stopAndClearQueue();
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            setIsAgentSpeaking(false);
          } else if (msg.type === 'transcript') {
            setIsProcessing(false);
            setTranscripts((prev) => [
              ...prev,
              {
                id: `tr-${Date.now()}-${Math.random()}`,
                speaker: msg.speaker,
                text: msg.text,
                timestamp: new Date().toISOString(),
              },
            ]);
          } else if (msg.type === 'turn_complete') {
            setIsProcessing(false);
          } else if (msg.type === 'tool_executing') {
            setIsProcessing(true);
            setActiveTool({ name: msg.toolName, args: msg.args, status: 'EXECUTING' });
          } else if (msg.type === 'tool_executed') {
            setActiveTool({ name: msg.toolName, args: msg.args, status: msg.status });
            setToolHistory((prev) => [
              {
                id: `th-${Date.now()}`,
                callId: newCallId,
                toolName: msg.toolName,
                args: msg.args,
                result: msg.result,
                status: msg.status,
                executionTimeMs: 120,
                timestamp: new Date().toISOString(),
              },
              ...prev,
            ]);
            setTimeout(() => {
              setActiveTool(null);
            }, 3000);
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message);
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onerror = (e: any) => {
        console.warn('WebSocket error, falling back if possible:', e);
        if (!isGitHubPages && ws instanceof WebSocket) {
          const fallback = new BrowserVoiceSession(newCallId, customerPhone, currentCustomer?.id);
          fallback.onmessage = ws.onmessage;
          fallback.onclose = ws.onclose;
          fallback.onerror = ws.onerror;
          wsRef.current = fallback;
          return;
        }
        setErrorMessage('Voice connection encountered an error.');
      };

      ws.onclose = () => {
        if (callState === 'ACTIVE') {
          endCall();
        }
      };
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setErrorMessage(err.message || 'Failed to initialize voice session.');
      setCallState('ERROR');
      endCall();
    }
  };

  // End voice call & clean up streams
  const endCall = async () => {
    // 1. Stop recorder and speech recognition
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }

    // 2. Stop audio player and cancel speech synthesis
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 3. Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'end_call' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    // 4. Update session status on server
    if (callId) {
      try {
        await fetch(`/api/calls/${callId}/end`, { method: 'POST' });
      } catch {}
    }

    setCallState('IDLE');
    setIsCustomerSpeaking(false);
    setIsAgentSpeaking(false);
    setIsProcessing(false);
    setIsMuted(false);
    if (onCallEnded) onCallEnded();
  };

  // Toggle Mute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    recorderRef.current?.setMute(next);
  };

  // Quick simulation helper: simulate user speech for acceptance test without typing
  const triggerSimulatedSpeech = (phrase: string) => {
    if (callState !== 'ACTIVE') {
      alert('Please click "Start Hands-Free Call" first!');
      return;
    }
    // Stop agent playback if playing
    playerRef.current?.stopAndClearQueue();
    setIsAgentSpeaking(false);
    setIsCustomerSpeaking(true);
    setIsProcessing(true);

    // Send text_input fallback
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text_input', text: phrase }));
      setTranscripts((prev) => [
        ...prev,
        {
          id: `tr-user-${Date.now()}`,
          speaker: 'customer',
          text: phrase,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setTimeout(() => {
      setIsCustomerSpeaking(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Simulation Acceptance Test Instructions Card */}
      <div className="bg-gradient-to-r from-blue-900/30 to-teal-900/30 border border-blue-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="w-24 h-24 text-teal-400" />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                100% HANDS-FREE • NO SEND BUTTON
              </span>
              <span className="text-xs font-medium text-slate-300">
                Live VAD & Model Turn-Detection Active
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              XYZ Bank Real-Time Voice Simulation Console
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Start the call once, then <strong>speak naturally into your microphone</strong>. Ananya detects when you finish speaking, verifies identity, retrieves balances, blocks cards, or books branch visits in real time without clicking anything.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            {callState === 'IDLE' ? (
              <button
                onClick={startCall}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5 animate-pulse" />
                <span>Start Hands-Free Call</span>
              </button>
            ) : (
              <button
                onClick={endCall}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call ({formatDuration(callDuration)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Acceptance Test Prompts Bar */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Acceptance Test Phrases:
          </span>
          <button
            onClick={() => triggerSimulatedSpeech("Hello, I want to know my account balance.")}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          >
            "Hello, I want to know my account balance."
          </button>
          <button
            onClick={() => triggerSimulatedSpeech("Also, block my debit card.")}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          >
            "Also, block my debit card."
          </button>
          <button
            onClick={() => triggerSimulatedSpeech("Yes, please confirm and block it.")}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 transition-colors font-medium"
          >
            "Yes, please confirm and block it."
          </button>
          <button
            onClick={() => triggerSimulatedSpeech("Where is the nearest branch in Bengaluru?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          >
            "Where is the nearest branch in Bengaluru?"
          </button>
          <button
            onClick={() => triggerSimulatedSpeech("ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಹುದೇ? (Can we speak in Kannada?)")}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 transition-colors"
          >
            "Kannada Switch"
          </button>
        </div>
      </div>

      {/* Main Call Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Virtual Telephony Phone Station */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            {/* Caller ID Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {currentCustomer?.name || 'Guest Caller'}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentCustomer?.phone || '+91 98765 43210'}
                  </span>
                </div>
              </div>
              <button
                onClick={onOpenCustomerPicker}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Switch
              </button>
            </div>

            {/* Avatar & Dynamic State Display */}
            <div className="my-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                {/* Outer animated halo rings */}
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isAgentSpeaking
                      ? 'bg-teal-500/20 ring-8 ring-teal-500/10 scale-105'
                      : isCustomerSpeaking
                      ? 'bg-blue-500/20 ring-8 ring-blue-500/10 scale-105'
                      : isProcessing
                      ? 'bg-amber-500/20 ring-8 ring-amber-500/10 animate-pulse'
                      : callState === 'ACTIVE'
                      ? 'bg-emerald-500/10 ring-4 ring-emerald-500/10'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-inner ${
                      isAgentSpeaking
                        ? 'bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-teal-500/50'
                        : isCustomerSpeaking
                        ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-500/50'
                        : isProcessing
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white'
                        : callState === 'ACTIVE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isAgentSpeaking ? (
                      <Volume2 className="w-10 h-10 animate-pulse" />
                    ) : isCustomerSpeaking ? (
                      <Mic className="w-10 h-10 animate-bounce" />
                    ) : isProcessing ? (
                      <RotateCcw className="w-10 h-10 animate-spin" />
                    ) : (
                      <Radio className="w-10 h-10" />
                    )}
                  </div>
                </div>

                {/* Status Dot */}
                <span
                  className={`absolute bottom-1 right-2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 ${
                    callState === 'ACTIVE'
                      ? isAgentSpeaking
                        ? 'bg-teal-400 animate-ping'
                        : isCustomerSpeaking
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              {/* Status Text */}
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {callState === 'IDLE' && 'Call Disconnected'}
                {callState === 'CONNECTING' && 'Establishing Voice Session...'}
                {callState === 'ACTIVE' && isAgentSpeaking && 'Ananya is Speaking aloud...'}
                {callState === 'ACTIVE' && isCustomerSpeaking && 'Customer Speaking (Listening)...'}
                {callState === 'ACTIVE' && isProcessing && 'Ananya analyzing banking request...'}
                {callState === 'ACTIVE' && !isAgentSpeaking && !isCustomerSpeaking && !isProcessing && 'Listening (Speak Hands-Free)'}
                {callState === 'ERROR' && 'Call Error'}
              </h4>

              <p className="text-xs text-slate-400 font-mono mt-1">
                {callState === 'ACTIVE' ? `Duration: ${formatDuration(callDuration)}` : 'Ready to connect'}
              </p>
            </div>

            {/* Audio Wave Visualizer */}
            <div className="py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 mb-4">
              <AudioVisualizer
                isActive={callState === 'ACTIVE'}
                isSpeaking={isCustomerSpeaking}
                volume={micVolume}
                agentSpeaking={isAgentSpeaking}
              />
            </div>

            {/* Language Selector */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Language Model
                </span>
                <span className="text-[11px] font-normal text-slate-400">Indian English / Multi</span>
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Auto Detect">Auto Detect (Multilingual Indian English, Hindi, etc.)</option>
                <option value="Indian English">English (Indian Accent - Ananya)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Malayalam">Malayalam (മലയാളം)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
              </select>
            </div>
          </div>

          {/* Call Station Controls */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
            {callState === 'ACTIVE' && (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-3.5 rounded-full border transition-all ${
                    isMuted
                      ? 'bg-amber-500 text-white border-amber-600 ring-4 ring-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    // Manual Interrupt test
                    if (playerRef.current) playerRef.current.stopAndClearQueue();
                    setIsAgentSpeaking(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700"
                  title="Simulate Customer Interrupting Agent"
                >
                  Interrupt AI
                </button>

                <button
                  onClick={endCall}
                  className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white border border-red-700 shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  title="End Telephone Call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </>
            )}

            {callState === 'IDLE' && (
              <button
                onClick={startCall}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <Phone className="w-4 h-4" />
                <span>Connect Voice Call</span>
              </button>
            )}
          </div>
        </div>

        {/* Center / Right Column: Live Captions, Tool Executions, and OTP Assistant */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Active Tool Execution Pill */}
          {activeTool && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center justify-between text-xs animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  Tool Invocations: <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">{activeTool.name}</code>
                </span>
              </div>
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Executing backend banking verification...
              </span>
            </div>
          )}

          {/* Simulation OTP Assistant (When unauthenticated) */}
          {activeOtp && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                      SIMULATED OTP CODE:
                    </span>
                    <span className="font-mono font-extrabold text-base tracking-widest text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                      {activeOtp}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    Say into your mic: <em>"My OTP is {activeOtp.split('').join(' ')}"</em>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerSimulatedSpeech(`My verification code is ${activeOtp}`)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Simulate Saying OTP
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeOtp);
                    setCopiedOtp(true);
                    setTimeout(() => setCopiedOtp(false), 2000);
                  }}
                  className="p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 rounded-lg"
                  title="Copy OTP"
                >
                  {copiedOtp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3.5 flex items-start gap-3 text-xs text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <span className="font-bold">Voice Error: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Live Transcript & Conversation Window */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-[420px] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Live Conversation Transcript
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {transcripts.length} turns recorded
              </span>
            </div>

            {/* Transcript scroll area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {transcripts.length === 0 && callState === 'IDLE' && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                  <Headphones className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No Active Call
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Click <strong>Start Hands-Free Call</strong> above, speak your request into the microphone, and Ananya will answer aloud.
                  </p>
                </div>
              )}

              {transcripts.map((t) => {
                const isUser = t.speaker === 'customer';
                const isSys = t.speaker === 'system';

                if (isSys) {
                  return (
                    <div key={t.id} className="text-center my-2">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/60 inline-block">
                        {t.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {isUser ? currentCustomer?.name || 'Customer' : 'Ananya (XYZ Bank)'}
                      </span>
                      <span>•</span>
                      <span>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/70'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                );
              })}

              {/* Real-time typing/processing placeholder */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  <span>Ananya is analyzing your request...</span>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Optional Accessibility Text Drawer (Does not interfere with hands-free voice) */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem('textInput') as HTMLInputElement);
                  if (input && input.value.trim()) {
                    triggerSimulatedSpeech(input.value.trim());
                    input.value = '';
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  name="textInput"
                  type="text"
                  placeholder="Optional text fallback for accessibility (voice is hands-free)..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={callState !== 'ACTIVE'}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  Submit Text
                </button>
              </form>
            </div>
          </div>

          {/* Real-time Backend Tool Invocations Log */}
          {toolHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-500" />
                Backend Banking Tools Executed in this Call
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {toolHistory.map((th) => (
                  <div
                    key={th.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {th.toolName}()
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            th.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {th.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        Result: {JSON.stringify(th.result)}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(th.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
