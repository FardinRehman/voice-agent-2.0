import React from 'react';
import {
  PhoneCall,
  UserCheck,
  LayoutDashboard,
  ShieldCheck,
  Server,
  BookOpen,
  Headphones,
} from 'lucide-react';

export type ActiveTab = 'overview' | 'simulator' | 'customer' | 'admin' | 'audit' | 'integrations';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'simulator',
      label: 'Voice Simulator',
      icon: <PhoneCall className="w-4 h-4" />,
      badge: 'LIVE VAD',
    },
    {
      id: 'customer',
      label: 'Customer Portal',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'audit',
      label: 'Audit & Security',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'integrations',
      label: 'Integrations & SIP',
      icon: <Server className="w-4 h-4" />,
    },
    {
      id: 'overview',
      label: 'Platform Overview',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-teal-400 text-slate-950'
                        : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
