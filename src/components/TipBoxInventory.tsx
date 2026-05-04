import React, { useState, useEffect, useRef } from 'react';
import { Denominations, Permissions } from '../types';
import { Banknote, Calculator, Save, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { storage } from '../lib/storage';

const DENOM_LABELS = [500, 200, 100, 50, 20, 10, 5] as const;

interface TipBoxInventoryProps {
  permissions: Permissions;
}

export default function TipBoxInventory({ permissions }: TipBoxInventoryProps) {
  const [denominations, setDenominations] = useState<Denominations>({
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  // Focus Management Refs
  const inputRefs = {
    500: useRef<HTMLInputElement>(null),
    200: useRef<HTMLInputElement>(null),
    100: useRef<HTMLInputElement>(null),
    50: useRef<HTMLInputElement>(null),
    20: useRef<HTMLInputElement>(null),
    10: useRef<HTMLInputElement>(null),
    5: useRef<HTMLInputElement>(null)
  };

  useEffect(() => {
    setDenominations(storage.getInventory());
  }, []);

  const totalCash = DENOM_LABELS.reduce((acc, label) => acc + (label * (denominations[label] || 0)), 0);

  const handleSave = () => {
    if (!permissions.canSeeAllData) return;
    setIsSaving(true);
    storage.saveInventory(denominations);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleInputChange = (label: keyof Denominations, value: string) => {
    if (!permissions.canSeeAllData) return;
    const num = parseInt(value) || 0;
    setDenominations(prev => ({ ...prev, [label]: Math.max(0, num) }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, denom: typeof DENOM_LABELS[number]) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = DENOM_LABELS.indexOf(denom);
      const nextDenom = DENOM_LABELS[currentIndex + 1];

      if (nextDenom && inputRefs[nextDenom].current) {
        inputRefs[nextDenom].current?.focus();
      } else if (e.key === "Enter") {
        // Last one pressed Enter -> Logic: Save and Blur
        handleSave();
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = DENOM_LABELS.indexOf(denom);
      const prevDenom = DENOM_LABELS[currentIndex - 1];

      if (prevDenom && inputRefs[prevDenom].current) {
        inputRefs[prevDenom].current?.focus();
      }
    }
  };

  if (!permissions.canSeeAllData && !permissions.canSeeTotalCollection) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto">
          <Lock size={24} />
        </div>
        <h3 className="font-black text-slate-800 uppercase tracking-tight">Access Restricted</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Inventory data is only visible to management.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <Banknote size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Box Inventory</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Cash Count</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-1">Total Assets</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight italic">₹{totalCash.toLocaleString()}</span>
        </div>
      </div>

      {permissions.canSeeAllData ? (
        <>
          <div className="p-6 flex-1 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              {DENOM_LABELS.map((label) => (
                <div key={label} className="group transition-all">
                  <div className={cn(
                    "flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100 transition-all",
                    "group-hover:bg-white group-hover:border-blue-200 group-hover:shadow-md"
                  )}>
                    <div className={cn(
                      "w-16 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-black text-slate-500 shadow-sm relative transition-colors",
                      "group-hover:border-blue-500"
                    )}>
                      <span className="text-xs uppercase tracking-widest">₹{label}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        ref={inputRefs[label]}
                        value={denominations[label] || ''}
                        onChange={(e) => handleInputChange(label, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, label)}
                        onFocus={(e) => e.target.select()}
                        className={cn(
                          "w-full bg-transparent p-2 outline-none font-black text-slate-700 text-lg placeholder-slate-200"
                        )}
                        placeholder="0"
                      />
                      <div className="hidden sm:flex flex-col text-[10px] font-black text-slate-400 uppercase pr-2">
                        <span>X {label}</span>
                        <span className="text-blue-500 text-xs">₹{(label * (denominations[label] || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest text-xs relative overflow-hidden",
                isSaving ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Updating Vault...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Update Physical Count</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="p-12 text-center flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Calculator size={32} />
          </div>
          <div>
            <h4 className="font-black text-slate-700 uppercase tracking-tight">Viewing Aggregated Data</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Breakdown is restricted by your system role</p>
          </div>
        </div>
      )}
    </div>
  );
}
