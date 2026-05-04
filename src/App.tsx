/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { OperationType } from './types';
import { handleFirestoreError } from './lib/firebase-utils';

// Components
import Sidebar from './components/Sidebar';
import StaffManager from './components/StaffManager';
import AdvanceManager from './components/AdvanceManager';
import TipBoxInventory from './components/TipBoxInventory';
import EarningsCalculator from './components/EarningsCalculator';
import PayoutMatrix from './components/PayoutMatrix';
import BackupRestore from './components/BackupRestore';

import { Table } from 'lucide-react';

enum ActiveTab {
  Dashboard = 'dashboard',
  Staff = 'staff',
  Advances = 'advances',
  Inventory = 'inventory',
  Payouts = 'payouts',
  Settings = 'settings'
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Dashboard);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [appSettings, setAppSettings] = useState({ name: 'TIPS PRO', subtitle: 'EVEREST DEVS' });

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'current'), 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAppSettings({ 
            name: (data.appName || 'TIPS PRO').toUpperCase(), 
            subtitle: (data.subtitle || 'EVEREST DEVS').toUpperCase() 
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/current');
      }
    );
    return () => unsub();
  }, []);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        appName={appSettings.name}
        subtitle={appSettings.subtitle}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-400 tracking-[0.2em] uppercase">
              {activeTab.replace('-', ' ')}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-800">Operational</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 tracking-wider">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>
        </header>

        <main className="p-8 pb-12 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === ActiveTab.Dashboard && (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Main Dashboard</h3>
                      <p className="text-sm font-medium text-slate-400">Real-time earnings metrics</p>
                    </div>
                    <EarningsCalculator />
                  </section>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <TipBoxInventory />
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-blue-200">
                      <div className="space-y-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                          <Table className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Financial Matrix</h3>
                        <p className="text-blue-100 font-medium leading-relaxed">View a detailed breakdown of earnings, deductions, and final settlements for the entire roster.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab(ActiveTab.Payouts)}
                        className="mt-8 px-8 py-4 bg-white text-blue-700 font-black rounded-2xl hover:shadow-xl active:scale-95 transition-all w-fit"
                      >
                        Launch Matrix
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === ActiveTab.Staff && <StaffManager />}
              {activeTab === ActiveTab.Advances && <AdvanceManager />}
              {activeTab === ActiveTab.Inventory && <TipBoxInventory />}
              {activeTab === ActiveTab.Payouts && <PayoutMatrix />}
              {activeTab === ActiveTab.Settings && <BackupRestore />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
