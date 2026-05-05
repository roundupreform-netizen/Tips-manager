import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { storage, getDefaultPermissions } from './lib/storage';
import { firestoreService } from './services/firestoreService';
import { useSettings } from './hooks/useRealtimeData';
import { User, AppSettings, Permissions } from './types';

// Components
import Sidebar from './components/Sidebar';
import StaffManager from './components/StaffManager';
import AdvanceManager from './components/AdvanceManager';
import TipBoxInventory from './components/TipBoxInventory';
import PenaltyManager from './components/PenaltyManager';
import EarningsCalculator from './components/EarningsCalculator';
import PayoutMatrix from './components/PayoutMatrix';
import BackupRestore from './components/BackupRestore';
import UserManager from './components/UserManager';

import { Table, Moon, Sun, AlertCircle } from 'lucide-react';

enum ActiveTab {
  Dashboard = 'dashboard',
  Staff = 'staff',
  Advances = 'advances',
  Penalties = 'penalties',
  Inventory = 'inventory',
  Payouts = 'payouts',
  Users = 'users',
  Settings = 'settings'
}

export default function App() {
  const { data: appSettings, loading: settingsLoading } = useSettings();
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Dashboard);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user] = useState<User>(storage.getCurrentUser());
  const [permissions] = useState<Permissions>(getDefaultPermissions(storage.getCurrentUser().role));

  const toggleTheme = async () => {
    try {
      const newTheme = appSettings.theme === 'light' ? 'dark' : 'light';
      await firestoreService.saveSettings({ theme: newTheme });
    } catch (error: any) {
      if (error.message?.includes('permission')) {
        alert("Permission error. Check Firestore rules.");
      }
    }
  };

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      appSettings.theme === 'dark' ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
    )}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as ActiveTab)} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        appName={appSettings.appName}
        subtitle={appSettings.subtitle}
        user={user}
        permissions={permissions}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className={cn(
          "h-20 px-4 sm:px-8 border-b flex items-center justify-between sticky top-0 md:bg-opacity-80 backdrop-blur-md z-30 transition-colors",
          appSettings.theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-100"
        )}>
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight uppercase">
              {activeTab === ActiveTab.Dashboard && 'Core Dashboard'}
              {activeTab === ActiveTab.Staff && 'Staff Portal'}
              {activeTab === ActiveTab.Advances && 'Cash Advances'}
              {activeTab === ActiveTab.Penalties && 'Penalty System'}
              {activeTab === ActiveTab.Inventory && 'Physical Inventory'}
              {activeTab === ActiveTab.Payouts && 'Financial Matrix'}
              {activeTab === ActiveTab.Users && 'Access Management'}
              {activeTab === ActiveTab.Settings && 'System Control'}
            </h2>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              appSettings.theme === 'dark' ? "text-slate-500" : "text-slate-400"
            )}>
              {appSettings.appName} • {appSettings.subtitle}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2.5 rounded-xl transition-all border",
                appSettings.theme === 'dark' 
                  ? "bg-slate-800 border-slate-700 text-amber-400" 
                  : "bg-white border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm"
              )}
              title="Toggle Theme"
            >
              {appSettings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider",
              appSettings.theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
            )}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === ActiveTab.Dashboard && (
                <div className="space-y-8">
                  <EarningsCalculator permissions={permissions!} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TipBoxInventory permissions={permissions!} />
                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-indigo-200/20">
                      <div className="space-y-4">
                        <Table className="w-12 h-12 opacity-50" />
                        <h3 className="text-2xl font-black tracking-tight">Financial Matrix</h3>
                        <p className="text-indigo-100 text-sm font-medium leading-relaxed">View detailed settlements, deductions, and final points calculation for all active staff members.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab(ActiveTab.Payouts)}
                        className="mt-6 px-6 py-3 bg-white text-indigo-600 font-black rounded-xl w-fit active:scale-95 transition-all text-xs uppercase tracking-widest"
                      >
                        Launch Matrix
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === ActiveTab.Staff && <StaffManager permissions={permissions!} />}
              {activeTab === ActiveTab.Advances && <AdvanceManager permissions={permissions!} />}
              {activeTab === ActiveTab.Penalties && <PenaltyManager permissions={permissions!} />}
              {activeTab === ActiveTab.Inventory && <TipBoxInventory permissions={permissions!} />}
              {activeTab === ActiveTab.Payouts && <PayoutMatrix user={user} permissions={permissions!} />}
              {activeTab === ActiveTab.Users && <UserManager permissions={permissions!} />}
              {activeTab === ActiveTab.Settings && <BackupRestore permissions={permissions!} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
