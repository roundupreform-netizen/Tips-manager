import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Check,
  Lock
} from 'lucide-react';
import { AppSettings, Permissions } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { storage } from '../lib/storage';

interface BackupRestoreProps {
  permissions: Permissions;
}

export default function BackupRestore({ permissions }: BackupRestoreProps) {
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    if (!permissions.canSeeAllData) return;
    setIsSaving(true);
    const updated = { ...settings, ...newSettings };
    storage.saveSettings(updated);
    setSettings(updated);
    setTimeout(() => setIsSaving(false), 500);
  };

  const exportData = () => {
    if (!permissions.canSeeAllData) return; 
    const data = {
      users: storage.getUsers(),
      staff: storage.getStaff(),
      advances: storage.getAdvances(),
      inventory: storage.getInventory(),
      settings: storage.getSettings(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tips_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!permissions.canSeeAllData) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.users) storage.saveUsers(data.users);
        if (data.staff) storage.saveStaff(data.staff);
        if (data.advances) storage.saveAdvances(data.advances);
        if (data.inventory) storage.saveInventory(data.inventory);
        if (data.settings) storage.saveSettings(data.settings);
        
        alert('Data successfully imported! Refreshing...');
        window.location.reload();
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const resetSystem = () => {
    if (!permissions.canSeeAllData) return;
    if (!confirm('EXTREME WARNING: This will delete ALL staff, advances, and inventory records. Users will remain. Proceed?')) return;
    setIsResetting(true);
    storage.saveStaff([]);
    storage.saveAdvances([]);
    storage.saveInventory({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0 });
    setTimeout(() => {
      setIsResetting(false);
      alert('System reset successfully.');
      window.location.reload();
    }, 1000);
  };

  if (!permissions.canSeeAllData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-sm">
          <Lock size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h2>
          <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Only authorized Administrators can access system settings and data management tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Control</h2>
            <p className="text-sm font-medium text-slate-500 italic block">Everest Developers Professional Suite v3.0</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8 sm:p-12 space-y-12">
          {/* Identity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Branding</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Customize how the application identifies itself across the system.</p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Primary Name</label>
                <input 
                  value={settings.appName}
                  onChange={(e) => handleSaveSettings({ appName: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub-branding / Tagline</label>
                <input 
                  value={settings.subtitle}
                  onChange={(e) => handleSaveSettings({ subtitle: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-slate-700" 
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Maintenance Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Offline Recovery</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Export your data to a JSON file for local backup or transfer.</p>
            </div>
            <div className="lg:col-span-2 flex flex-wrap gap-4">
              <button 
                onClick={exportData}
                className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg shadow-slate-900/20 active:scale-95 text-xs uppercase tracking-widest"
              >
                <Download size={20} /> Export Local JSON
              </button>
              
              <label className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm cursor-pointer active:scale-95 text-xs uppercase tracking-widest">
                <Upload size={20} /> Import Backup
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Dangerous Zone */}
          <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldCheck size={20} />
                <h3 className="text-lg font-black uppercase tracking-widest">Master Reset</h3>
              </div>
              <p className="text-sm font-medium text-rose-700 leading-relaxed max-w-lg">
                Instantly clear all operational data (Staff, Advances, Inventory). This action is irreversible and primarily for use at the end of financial cycles.
              </p>
            </div>
            <button 
              onClick={resetSystem}
              disabled={isResetting}
              className="px-8 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-500 transition-all flex items-center gap-3 shadow-lg shadow-rose-200 active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {isResetting ? <Check size={20} className="animate-bounce" /> : <RotateCcw size={20} />}
              System Wipe
            </button>
          </div>
        </div>
      </section>

      <div className="text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Tips Manager Pro • Everest Developers • Powered by LocalStorage</p>
      </div>
    </div>
  );
}
