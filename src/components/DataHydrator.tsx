import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestoreService';
import { storage } from '../lib/storage';
import { Loader2, Database, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const APP_VERSION = '1.1';

export default function DataHydrator({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState('Initializing system...');

  useEffect(() => {
    const hydrate = async () => {
      try {
        // 1. Check if we have already migrated (using a flag in localStorage)
        const migrationKey = `tips_migrated_v${APP_VERSION}`;
        const hasMigrated = localStorage.getItem(migrationKey);

        if (!hasMigrated) {
          setStatus('Synchronizing local data to cloud...');
          
          // Staff Migration
          const localStaff = storage.getStaff();
          if (localStaff.length > 0) {
            for (const staff of localStaff) {
              await firestoreService.saveStaffMember(staff, staff.id);
            }
          }

          // Advances Migration
          const localAdvances = storage.getAdvances();
          if (localAdvances.length > 0) {
            for (const adv of localAdvances) {
              await firestoreService.saveAdvance(adv);
            }
          }

          // Settings Migration
          const localSettings = storage.getSettings();
          await firestoreService.saveSettings(localSettings);

          // Inventory Migration
          const localInv = storage.getInventory();
          await firestoreService.saveInventory(localInv);

          // User Migration
          const localUsers = storage.getUsers();
          for (const u of localUsers) {
            await firestoreService.saveUser(u);
          }

          localStorage.setItem(migrationKey, 'true');
        }

        // 2. Ensure initial data exists if it's a completely fresh setup
        const settings = await firestoreService.getSettings();
        if (!settings) {
          setStatus('Finalizing fresh installation...');
          await firestoreService.saveSettings({
            appName: 'Tips Manager Pro',
            subtitle: 'Everest Developers',
            kitchenMode: 'fixed',
            kitchenValue: 0,
            theme: 'light'
          });
        }

        const users = await firestoreService.getUsers();
        if (users.length === 0) {
           // Should be handled by migration, but just in case
           const initialAdmin = storage.getUsers()[0];
           await firestoreService.saveUser(initialAdmin);
        }

        setIsHydrated(true);
      } catch (error) {
        console.error('Hydration failed:', error);
        setStatus('Error syncing with cloud. Please check connection.');
      }
    };

    hydrate();
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 p-12 rounded-[3rem] text-center space-y-8 shadow-2xl"
        >
          <div className="relative mx-auto w-24 h-24">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center text-indigo-500">
              <Database size={40} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">System Syncing</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{status}</p>
          </div>

          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center gap-3 text-left">
            <ShieldCheck className="text-indigo-400 shrink-0" size={24} />
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-tight leading-relaxed">
              Establishing a secure, encrypted connection to Everest Cloud Protocol v{APP_VERSION}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
