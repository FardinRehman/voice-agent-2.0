import React, { useState, useEffect } from 'react';
import { Customer, BankAccount, BankCard, Transaction, ComplaintTicket } from '../types/banking.ts';
import { formatCurrencyINR, formatDateTime } from '../utils/formatters.ts';
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  RefreshCw,
  Building,
} from 'lucide-react';

interface CustomerDashboardProps {
  currentCustomer: Customer | null;
  onOpenCustomerPicker: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentCustomer,
  onOpenCustomerPicker,
}) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [complaints, setComplaints] = useState<ComplaintTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    if (!currentCustomer) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${currentCustomer.id}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      setCards(data.cards || []);
      setTransactions(data.transactions || []);
      setComplaints(data.complaints || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentCustomer]);

  const handleCardToggle = async (card: BankCard) => {
    if (!currentCustomer) return;
    const isBlocked = card.status === 'TEMPORARILY_BLOCKED';
    const endpoint = isBlocked ? `/api/cards/${card.id}/unblock` : `/api/cards/${card.id}/block`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentCustomer.id,
          reason: isBlocked ? 'Customer unblocked via dashboard' : 'Customer locked via dashboard',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!currentCustomer) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">Please select a customer first.</p>
        <button
          onClick={onOpenCustomerPicker}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          Select Customer
        </button>
      </div>
    );
  }

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Customer Header Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
              {currentCustomer.id}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Full KYC Verified
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {currentCustomer.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered Mobile: <strong>{currentCustomer.phone}</strong> • PAN: <strong>{currentCustomer.panNumber}</strong> • Language: <strong>{currentCustomer.preferredLanguage}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Combined Liquid Assets</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrencyINR(totalBalance)}
            </span>
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Refresh Banking Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Linked Bank Accounts */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-600" />
          Linked Bank Accounts ({accounts.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {acc.accountType} ACCOUNT
                  </span>
                  <div className="mt-2 text-sm font-mono text-slate-600 dark:text-slate-300">
                    {acc.maskedAccountNumber}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {acc.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Available Balance</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrencyINR(acc.balance)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  IFSC: {acc.ifscCode}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-teal-600" />
          Linked Debit & Credit Cards ({cards.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((c) => {
            const isBlocked = c.status === 'TEMPORARILY_BLOCKED';
            const isPermBlocked = c.status === 'PERMANENTLY_BLOCKED';
            return (
              <div
                key={c.id}
                className={`rounded-2xl p-5 border transition-all ${
                  isPermBlocked
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                    : isBlocked
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-400 font-semibold">{c.cardNetwork} {c.cardType}</span>
                    <div className="text-base font-mono font-bold tracking-widest text-slate-900 dark:text-white mt-1">
                      {c.maskedCardNumber}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isBlocked
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Expires: {c.expiryMonth}/{c.expiryYear}</span>
                  <span>Daily ATM Limit: {formatCurrencyINR(c.dailyAtmLimit)}</span>
                </div>

                {c.blockReason && (
                  <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 italic">
                    Reason: {c.blockReason}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Card ID: {c.id}</span>
                  {!isPermBlocked && (
                    <button
                      onClick={() => handleCardToggle(c)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {isBlocked ? 'Unblock Card' : 'Block Card'}
                    </button>
                  )}
                  {isPermBlocked && (
                    <span className="text-xs text-red-600 font-medium">Permanently Blocked (Visit Branch)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600" />
          Recent Transactions
        </h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((t) => {
                  const isCredit = t.type === 'CREDIT';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                        {formatDateTime(t.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {t.description}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {t.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isCredit ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${isCredit ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        {isCredit ? '+' : '-'}{formatCurrencyINR(t.amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {t.referenceNumber}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Service Grievances & Complaints ({complaints.length})
        </h2>
        {complaints.length === 0 ? (
          <p className="text-xs text-slate-400 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            No active grievances registered.
          </p>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {c.id}
                    </span>
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      {c.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{c.description}</p>
                {c.resolutionNotes && (
                  <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                    Resolution: {c.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
