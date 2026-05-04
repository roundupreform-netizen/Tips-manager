import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  Trash2, 
  RefreshCcw, 
  Settings as SettingsIcon,
  Globe,
  Moon,
  Sun,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType, AppSettings } from '../types';
import { handleFirestoreError } from '../lib/firebase-utils';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Tips Pro',
    subtitle: 'By Everest Developers',
    currency: '₹',
    kitchenMode: 'fixed',
    kitchenValue: 0,
    contact: { phone: '', email: '', whatsapp: '', address: '' },
    privacyPolicy: '',
    theme: 'system'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'current'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          ...data,
          contact: data.contact || prev.contact
        }));
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    setIsSaving(true);
    try {
      const updated = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'current'), updated, { merge: true });
      setSettings(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/current');
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const collections = ['staff', 'advances', 'inventory', 'settings'];
      const data: any = {};
      
      for (const collName of collections) {
        const querySnapshot = await getDocs(collection(db, collName));
        data[collName] = querySnapshot.docs.reduce((acc, doc) => ({
          ...acc,
          [doc.id]: doc.data()
        }), {});
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tips-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'backup');
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* General Settings */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <SettingsIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h2>
            <p className="text-slate-500 font-medium">Core application identity and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 space-y-6 shadow-sm">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Application Name</label>
              <input 
                type="text" 
                value={settings.appName}
                onChange={(e) => handleSaveSettings({ appName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">System Subtitle</label>
              <input 
                type="text" 
                value={settings.subtitle}
                onChange={(e) => handleSaveSettings({ subtitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Currency Symbol</label>
                <input 
                  type="text" 
                  value={settings.currency}
                  onChange={(e) => handleSaveSettings({ currency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 text-center outline-none focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="space-y-4 text-center">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Theme Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  {[
                    { id: 'light', icon: Sun },
                    { id: 'dark', icon: Moon },
                    { id: 'system', icon: Globe }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSaveSettings({ theme: t.id as any })}
                      className={cn(
                        "flex-1 p-3 rounded-xl transition-all flex items-center justify-center",
                        settings.theme === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      <t.icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 space-y-6 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <Phone className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-slate-900">Organization Identity</h3>
             </div>
             <div className="grid grid-cols-1 gap-4">
               <input 
                 placeholder="Business Phone"
                 value={settings.contact.phone}
                 onChange={(e) => handleSaveSettings({ contact: { ...settings.contact, phone: e.target.value } })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-semibold text-slate-700 outline-none"
               />
               <input 
                 placeholder="WhatsApp Link/Number"
                 value={settings.contact.whatsapp}
                 onChange={(e) => handleSaveSettings({ contact: { ...settings.contact, whatsapp: e.target.value } })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-semibold text-slate-700 outline-none"
               />
               <input 
                 placeholder="Support Email"
                 value={settings.contact.email}
                 onChange={(e) => handleSaveSettings({ contact: { ...settings.contact, email: e.target.value } })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-semibold text-slate-700 outline-none"
               />
               <textarea 
                 placeholder="Business Address"
                 value={settings.contact.address}
                 onChange={(e) => handleSaveSettings({ contact: { ...settings.contact, address: e.target.value } })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-semibold text-slate-700 outline-none h-24 resize-none"
               />
             </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy */}
      <section className="space-y-6">
         <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-slate-400" />
            <h3 className="text-xl font-bold">Data Privacy & Terms</h3>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <textarea 
              value={settings.privacyPolicy}
              onChange={(e) => handleSaveSettings({ privacyPolicy: e.target.value })}
              className="w-full h-48 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-50"
              placeholder="Paste your privacy policy text here..."
            />
         </div>
      </section>

      {/* Maintenance */}
      <section className="pt-12 border-t border-slate-200">
        <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldCheck size={20} />
              <h3 className="text-lg font-black uppercase tracking-widest">Maintenance Mode</h3>
            </div>
            <p className="text-sm font-medium text-red-700 leading-relaxed max-w-lg">
              Perform heavy database operations like zero-loss cloud exports or system resets. This area is strictly for system administrators.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={exportData}
              className="px-8 py-4 bg-white text-red-600 font-black rounded-2xl border border-red-200 hover:bg-red-50 transition-all flex items-center gap-3 shadow-sm active:scale-95"
            >
              <Download size={20} /> Export Cloud JSON
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
