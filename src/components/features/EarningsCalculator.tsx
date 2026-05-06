import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember, AdvanceEntry, PenaltyEntry, AppSettings, Permissions } from '../../types';
import { 
  Plus, 
  TrendingUp, 
  Percent, 
  Wallet, 
  Scissors, 
  Calculator,
  Lock,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStaff, useAdvances, usePenalties, useSettings, useInventory } from '../../hooks/useRealtimeData';
import { firestoreService } from '../../services/firestoreService';
import { Loader2 } from 'lucide-react';

interface EarningsCalculatorProps {
  permissions: Permissions;
}

export default function EarningsCalculator({ permissions }: EarningsCalculatorProps) {
  const { data: staff, loading: staffLoading } = useStaff();
  const { data: advances, loading: advancesLoading } = useAdvances();
  const { data: penalties, loading: penaltiesLoading } = usePenalties();
  const { data: settings, loading: settingsLoading } = useSettings();
  const { data: inventory, loading: inventoryLoading } = useInventory();

  const handleUpdateSettings = (mode: 'fixed' | 'percentage', value: number) => {
    if (!permissions.canSeeAllData) return;
    firestoreService.saveSettings({ kitchenMode: mode, kitchenValue: value });
  };

  const totalPoints = useMemo(() => {
    return staff.reduce((acc, curr) => acc + curr.points, 0);
  }, [staff]);

  const cashTotal = useMemo(() => {
    return Object.entries(inventory).reduce((acc, [label, count]) => {
      // Inventory includes id and updatedAt fields in Firestore
      if (isNaN(Number(label))) return acc;
      return acc + (Number(label) * (count as number));
    }, 0);
  }, [inventory]);

  const totalAdvanceAmount = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPenaltyAmount = penalties.reduce((acc, curr) => acc + curr.amount, 0);
  const grossCollection = cashTotal + totalAdvanceAmount + totalPenaltyAmount;
  
  const kitchenShare = settings.kitchenMode === 'fixed' 
    ? settings.kitchenValue 
    : (settings.kitchenValue / 100) * grossCollection;

  const netTips = grossCollection - kitchenShare;
  const pointValue = totalPoints > 0 ? netTips / totalPoints : 0;

  if (staffLoading || advancesLoading || penaltiesLoading || settingsLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const stats = [
    { label: 'Gross Tips', value: grossCollection, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', show: permissions.canSeeAllData || permissions.canSeeTotalCollection },
    { label: 'Total Advance', value: totalAdvanceAmount, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', show: permissions.canSeeAllData },
    { label: 'Total Penalty', value: totalPenaltyAmount, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', show: permissions.canSeeAllData },
    { label: 'Point Value', value: pointValue, icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50', isPrice: true, show: permissions.canSeeAllData }
  ].filter(s => s.show);

  return (
    <div className="space-y-6">
      <div className={cn(
        "grid gap-4",
        stats.length === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : 
        stats.length === 5 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 text-center" : "grid-cols-1 sm:grid-cols-2"
      )}>
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                stat.label === 'Gross Tips' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                stat.label === 'Total Advance' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" :
                stat.label === 'Total Penalty' ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              )}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic font-mono">Live Sync</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={cn("text-2xl font-black tracking-tight", 
                stat.label === 'Gross Tips' ? "text-emerald-600 dark:text-emerald-400" :
                stat.label === 'Total Advance' ? "text-indigo-600 dark:text-indigo-400" :
                stat.label === 'Total Penalty' ? "text-rose-600 dark:text-rose-400" :
                "text-blue-600 dark:text-blue-400"
              )}>
                ₹{stat.value.toLocaleString(undefined, { 
                  minimumFractionDigits: stat.label === 'Point Value' ? 2 : 0, 
                  maximumFractionDigits: stat.label === 'Point Value' ? 2 : 0 
                })}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {permissions.canSeeAllData && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2 max-w-sm">
              <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                <Percent size={24} />
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Kitchen Cut</h2>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Configure how the kitchen staff share is calculated. Changes apply instantly to all reports and payouts.
              </p>
            </div>

            <div className="flex-1 max-w-xl w-full space-y-6">
              <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-2 font-bold">
                <button
                  onClick={() => handleUpdateSettings('fixed', settings.kitchenValue)}
                  className={cn(
                    "flex-1 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                    settings.kitchenMode === 'fixed' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  )}
                >
                  Fixed ₹ Amount
                </button>
                <button
                  onClick={() => handleUpdateSettings('percentage', settings.kitchenValue)}
                  className={cn(
                    "flex-1 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                    settings.kitchenMode === 'percentage' 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  )}
                >
                  Percentage %
                </button>
              </div>

              <div className="flex items-center gap-6">
                {settings.kitchenMode === 'fixed' ? (
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={settings.kitchenValue || ''}
                      onChange={(e) => handleUpdateSettings('fixed', parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-black text-slate-800 dark:text-white"
                      placeholder="Enter fixed amount..."
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-purple-600 dark:text-purple-400">₹</span>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={settings.kitchenValue || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) handleUpdateSettings('percentage', 0);
                          else handleUpdateSettings('percentage', Math.min(50, Math.max(0, val)));
                        }}
                        className="w-full pr-12 pl-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-700 dark:text-slate-200"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-slate-500">%</span>
                    </div>
                    
                    <div className="flex gap-2">
                       {[5, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleUpdateSettings('percentage', pct)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                            settings.kitchenValue === pct 
                              ? "bg-purple-600 border-purple-600 text-white shadow-sm" 
                              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400"
                          )}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 flex flex-col justify-center min-w-[160px]">
                  <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mb-1">Deduction</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-200 tracking-tighter">₹{kitchenShare.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
