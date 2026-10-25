import React, { useState, useEffect } from 'react';
import { Customer } from './types/banking.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { VoiceSimulator } from './components/VoiceSimulator.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { IntegrationsPage } from './components/IntegrationsPage.tsx';
import { AuditLogsPage } from './components/AuditLogsPage.tsx';
import { HomeOverview } from './components/HomeOverview.tsx';
import { CustomerPickerModal } from './components/CustomerPickerModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [speakerVolume, setSpeakerVolume] = useState<number>(0.9);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch initial synthetic customer list
  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data || []);
      if (data && data.length > 0 && !currentCustomer) {
        // Default to Rajesh Sharma (CUST-1001) who has multiple accounts
        setCurrentCustomer(data[0]);
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Voice Preview Test using server-side TTS
  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Namaste! I am Ananya, your virtual voice banking assistant at XYZ Bank. How can I assist you with your accounts or cards today?',
          voiceName: 'Kore',
        }),
      });
      const data = await res.json();
      if (data.audio) {
        // Play sample audio
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audio.volume = speakerVolume;
        await audio.play();
      } else {
        alert(data.error || 'Voice preview unavailable');
      }
    } catch (err: any) {
      alert(`Voice preview error: ${err.message}`);
    } finally {
      setIsTestingVoice(false);
    }
  };

  // Reset database to initial synthetic seed
  const handleResetData = async () => {
    if (!confirm('Reset simulated database to default seed records? All changes will revert to defaults.')) return;
    try {
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      const data = await res.json();
      setToastMessage(data.message || 'Database reset successfully');
      setTimeout(() => setToastMessage(null), 3000);
      loadCustomers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCurrentCustomer(found);
      setToastMessage(`Switched simulated customer to ${found.name}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        currentCustomer={currentCustomer}
        onOpenCustomerPicker={() => setIsPickerOpen(true)}
        onResetData={handleResetData}
        volume={speakerVolume}
        onChangeVolume={setSpeakerVolume}
        onTestVoice={handleTestVoice}
        isTestingVoice={isTestingVoice}
        onNavigateToSimulator={() => setActiveTab('simulator')}
      />

      {/* Navigation Tabs */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Page View */}
      <main className="flex-1 pb-16">
        {activeTab === 'simulator' && (
          <VoiceSimulator
            currentCustomer={currentCustomer}
            onOpenCustomerPicker={() => setIsPickerOpen(true)}
            speakerVolume={speakerVolume}
            onCallEnded={loadCustomers}
          />
        )}

        {activeTab === 'customer' && (
          <CustomerDashboard
            currentCustomer={currentCustomer}
            onOpenCustomerPicker={() => setIsPickerOpen(true)}
          />
        )}

        {activeTab === 'admin' && <AdminDashboard />}

        {activeTab === 'audit' && <AuditLogsPage />}

        {activeTab === 'integrations' && <IntegrationsPage />}

        {activeTab === 'overview' && (
          <HomeOverview
            onNavigateToSimulator={() => setActiveTab('simulator')}
            onOpenCustomerPicker={() => setIsPickerOpen(true)}
            currentCustomer={currentCustomer}
          />
        )}
      </main>

      {/* Customer Picker Modal */}
      <CustomerPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        customers={customers}
        selectedCustomerId={currentCustomer?.id || ''}
        onSelectCustomer={handleSelectCustomer}
      />
    </div>
  );
}
