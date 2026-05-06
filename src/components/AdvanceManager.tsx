import React, { useState, useEffect, useMemo } from 'react';
import { AdvanceEntry, StaffMember, Permissions } from '../types';
import { Search, Plus, Trash2, Calendar, IndianRupee, Filter, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAdvances, useStaff } from '../hooks/useRealtimeData';
import { firestoreService } from '../services/firestoreService';
import { Loader2 } from 'lucide-react';

interface AdvanceManagerProps {
  permissions: Permissions;
}

export default function AdvanceManager({ permissions }: AdvanceManagerProps) {
  const { data: advances, loading: advancesLoading } = useAdvances();
  const { data: staff, loading: staffLoading } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ staffId: '', amount: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canSeeAllData) return;
    if (!formData.staffId || formData.amount <= 0) return;

    const selectedStaff = staff.find(s => s.id === formData.staffId);
    if (!selectedStaff) return;

    const newAdvance: Omit<AdvanceEntry, 'id'> = {
      staffId: formData.staffId,
      staffName: selectedStaff.name,
      position: selectedStaff.position,
      amount: formData.amount,
      date: new Date().toISOString(),
    };

    await firestoreService.saveAdvance(newAdvance);
    setFormData({ staffId: '', amount: 0 });
  };

  const handleDelete = async (id: string) => {
    if (!permissions.canSeeAllData) return;
    if (!confirm('Delete this advance record?')) return;
    await firestoreService.deleteAdvance(id);
  };

  const filteredAdvances = useMemo(() => {
    return advances.filter(adv => 
      (adv.staffName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (adv.position || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  }, [advances, searchTerm]);

  const totalAdvances = filteredAdvances.reduce((acc, curr) => acc + curr.amount, 0);

  if (!permissions.canSeeAllData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-3xl flex items-center justify-center shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Access Restricted</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">You do not have the required permissions to access advance records.</p>
        </div>
      </div>
    );
  }

  if (advancesLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Form - Only for Admin/Captain (those who see all data) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <IndianRupee size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">New Advance</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Select Staff</label>
                <select
                  required
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 dark:text-white"
                >
                  <option value="" className="dark:bg-slate-800">Choose employee...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.name} ({s.position})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Withdrawal Amount</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="0.00"
                  />
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <Plus size={18} /> Record Advance
              </button>
            </form>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-4 relative overflow-hidden shadow-xl shadow-indigo-100 dark:shadow-none">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Session Total</span>
              <h3 className="text-4xl font-black tracking-tight">₹{totalAdvances.toLocaleString()}</h3>
              <p className="text-indigo-100/70 text-xs font-bold mt-2 font-mono uppercase">Unsettled Cash Flow</p>
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-10">
              <IndianRupee size={120} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-slate-400 dark:text-slate-500" size={20} />
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Advanced Ledger</h3>
              </div>
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Filter by name or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={14} />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {filteredAdvances.length > 0 ? (
                      filteredAdvances.map((adv) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={adv.id} 
                          className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center font-black text-xs group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                {(adv.staffName || '?').charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-white">{adv.staffName}</span>
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{adv.position}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{format(new Date(adv.date), 'MMM dd, h:mm a')}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-black text-slate-900 dark:text-slate-200">₹{adv.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(adv.id)}
                              className="p-2.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-30">
                            <Filter size={40} />
                            <p className="font-black uppercase tracking-widest text-xs">No records found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
