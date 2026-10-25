import React, { useState, useEffect } from 'react';
import { CallSession, AuditLog } from '../types/banking.ts';
import { formatDuration, formatDateTime } from '../utils/formatters.ts';
import { CallDetailsModal } from './CallDetailsModal.tsx';
import {
  PhoneCall,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  AlertTriangle,
  Globe,
  Radio,
  Eye,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCall, setSelectedCall] = useState<CallSession | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anRes, callRes, audRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/calls'),
        fetch('/api/audit-logs'),
      ]);
      const anData = await anRes.json();
      const callData = await callRes.json();
      const audData = await audRes.json();

      setAnalytics(anData);
      setCalls(callData || []);
      setAuditLogs(audData || []);
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCalls = calls.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(term) ||
      (c.customerName && c.customerName.toLowerCase().includes(term)) ||
      c.callerNumber.includes(term) ||
      c.language.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            XYZ Bank AI Voice Agent Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time executive metrics, telephony call records, function execution telemetry, and audit trail.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Telephony Calls</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {analytics?.totalCalls || calls.length}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {analytics?.completedCalls || calls.filter(c => c.status === 'COMPLETED').length} Successful Completions
          </span>
        </div>

        {/* Average Duration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Call Duration</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatDuration(analytics?.avgDurationSeconds || 0)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Target SLA: &lt; 2m 30s
          </span>
        </div>

        {/* Tool Execution Success Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tool Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {analytics?.toolSuccessRate || 100}%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {analytics?.totalTools || 0} Tools Executed
          </span>
        </div>

        {/* Active Grievances */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {analytics?.openComplaints || 0}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            {analytics?.totalComplaints || 0} Total Logged
          </span>
        </div>
      </div>

      {/* Analytics Visual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            Top Banking Functions Invoked
          </h3>
          {analytics?.toolDistribution && Object.keys(analytics.toolDistribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.toolDistribution).map(([tool, count]: any) => (
                <div key={tool} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="font-mono text-slate-800 dark:text-slate-200">{tool}</span>
                    <span className="text-slate-500">{count} calls</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, (count / (analytics.totalTools || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No tool executions recorded yet.</p>
          )}
        </div>

        {/* Language Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-500" />
            Language Distribution
          </h3>
          {analytics?.languageDistribution && Object.keys(analytics.languageDistribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.languageDistribution).map(([lang, count]: any) => (
                <div key={lang} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{lang}</span>
                    <span className="text-slate-500">{count} calls</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (count / (analytics.totalCalls || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No language data recorded yet.</p>
          )}
        </div>
      </div>

      {/* Call History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Call Sessions & Records
            </h3>
            <span className="text-xs text-slate-400">Click any row to inspect transcripts and executed tools</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search call ID, customer, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Call ID</th>
                <th className="px-4 py-3 font-semibold">Caller / Customer</th>
                <th className="px-4 py-3 font-semibold">Start Time</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Language</th>
                <th className="px-4 py-3 font-semibold">Tools Invoked</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No call records match the filter.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCall(c)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {c.customerName || 'Anonymous Caller'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{c.callerNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                      {formatDateTime(c.startTime)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatDuration(c.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {c.language}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {c.toolsUsed?.length || 0} tools
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCall(c);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Details Modal */}
      <CallDetailsModal session={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  );
};
