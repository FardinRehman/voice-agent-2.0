import React from 'react';
import { CallSession } from '../types/banking.ts';
import { formatDuration, formatDateTime } from '../utils/formatters.ts';
import { X, Phone, CheckCircle2, AlertCircle, Wrench, Shield, MessageSquare, Clock } from 'lucide-react';

interface CallDetailsModalProps {
  session: CallSession | null;
  onClose: () => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                {session.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  session.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : session.status === 'TRANSFERRED'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}
              >
                {session.status}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • {session.mode} MODE
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Telephony Call Record Inspection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs / Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Customer</span>
              <span className="font-bold text-slate-800 dark:text-white mt-0.5 block truncate">
                {session.customerName || 'Unauthenticated Caller'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Caller Phone</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white mt-0.5 block">
                {session.callerNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Call Duration</span>
              <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">
                {formatDuration(session.durationSeconds)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Language</span>
              <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">
                {session.language}
              </span>
            </div>
          </div>

          {/* Tools Executed Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              Banking Tools Executed ({session.toolsUsed.length})
            </h3>
            {session.toolsUsed.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                No backend tools invoked during this conversation.
              </p>
            ) : (
              <div className="space-y-2">
                {session.toolsUsed.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {tool.toolName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            tool.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {tool.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Latency: {tool.executionTimeMs}ms
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold mb-1">Arguments:</span>
                        <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{JSON.stringify(tool.args, null, 2)}</pre>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold mb-1">Result:</span>
                        <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{JSON.stringify(tool.result, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Transcript Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              Full Conversation Transcript ({session.transcript.length} turns)
            </h3>
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 max-h-72 overflow-y-auto">
              {session.transcript.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No speech turns recorded.</p>
              ) : (
                session.transcript.map((item) => (
                  <div key={item.id} className="text-xs">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`font-bold ${
                          item.speaker === 'customer'
                            ? 'text-blue-600 dark:text-blue-400'
                            : item.speaker === 'agent'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.speaker === 'customer' ? 'Customer' : item.speaker === 'agent' ? 'Ananya (AI)' : 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                      {item.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
