import React, { useState, useEffect } from 'react';
import { StaffMember, PenaltyEntry, Permissions } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  AlertCircle,
  FileText,
  ShieldCheck,
  TrendingDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { usePenalties, useStaff } from '../hooks/useRealtimeData';
import { firestoreService } from '../services/firestoreService';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PenaltyManagerProps {
  permissions: Permissions;
}

export default function PenaltyManager({ permissions }: PenaltyManagerProps) {
  const { data: penalties, loading: penaltiesLoading } = usePenalties();
  const { data: staff, loading: staffLoading } = useStaff();
  const [isAdding, setIsAdding] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  const staffNames = staff.map(s => s.name);

  // Form State
  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    amount: '',
    checkedBy: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canSeeAllData) return;
    if (!formData.staffId || !formData.amount || !formData.reason || !formData.checkedBy) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await firestoreService.savePenalty({
        staffId: formData.staffId,
        staffName: formData.staffName,
        date: formData.date,
        reason: formData.reason,
        amount: parseFloat(formData.amount),
        checkedBy: formData.checkedBy,
      });

      setFormData({
        staffId: '',
        staffName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        amount: '',
        checkedBy: ''
      });
      setIsAdding(false);
    } catch (error) {
      // Error handled in service
    }
  };

  const handleDelete = async (id: string) => {
    if (!permissions.canSeeAllData) return;
    if (!confirm('Are you sure you want to delete this penalty record?')) return;
    await firestoreService.deletePenalty(id);
  };

  if (penaltiesLoading || staffLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-rose-500" size={32} />
      </div>
    );
  }

  const filteredPenalties = penalties.filter(p => {
    const matchesDate = filterDate ? p.date === filterDate : true;
    const matchesStaff = filterStaff ? p.staffId === filterStaff : true;
    return matchesDate && matchesStaff;
  });

  const totalPenaltiesAmount = filteredPenalties.reduce((acc, curr) => acc + curr.amount, 0);

  const staffSummary = penalties.reduce((acc: Record<string, number>, curr) => {
    acc[curr.staffName] = (acc[curr.staffName] || 0) + curr.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <span className="text-[10px] font-black text-rose-300 dark:text-rose-500/50 uppercase tracking-widest italic font-mono">Total Deductions</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Overall Total</p>
              <h3 className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-500">₹{totalPenaltiesAmount.toLocaleString()}</h3>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={12} />
              Staff Wise Breakdown
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(staffSummary).length > 0 ? (
                Object.entries(staffSummary).map(([name, amount], i) => (
                  <div key={i} className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">
                      {(name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-none mb-1">{name}</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">₹{amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest py-2">No individual data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {permissions.canSeeAllData && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white tracking-tighter italic">Penalty Management</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time tracking of staff penalties</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-blue-500 active:scale-95 transition-all shadow-lg"
          >
            <Plus size={16} />
            Add Penalty
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm"
          />
        </div>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors" size={18} />
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm appearance-none"
          >
            <option value="" className="dark:bg-slate-900">Filter by Staff Member...</option>
            {staff.map(s => (
              <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Checked By</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Amount ₹</th>
                {permissions.canSeeAllData && <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredPenalties.map((penalty) => (
                  <motion.tr 
                    key={penalty.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{format(new Date(penalty.date), 'dd MMM yyyy')}</span>
                        <span className="text-[8px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest italic">{format(new Date(penalty.date), 'EEEE')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]">
                          {(penalty.staffName || '?').charAt(0)}
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{penalty.staffName || 'Unknown Staff'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <FileText size={14} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-xs font-semibold">{penalty.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={14} className="opacity-60" />
                        <span className="text-xs font-black uppercase tracking-tight">{penalty.checkedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "font-black transition-transform group-hover:scale-110 duration-200",
                          penalty.amount >= 500 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
                        )}>
                          ₹{penalty.amount.toLocaleString()}
                        </span>
                        {penalty.amount >= 500 && (
                          <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-0.5 animate-pulse">
                            High Value
                          </span>
                        )}
                      </div>
                    </td>
                    {permissions.canSeeAllData && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(penalty.id)}
                          className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredPenalties.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2 opacity-40">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <FileText size={24} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">No penalties recorded</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white italic tracking-tighter">Add New Penalty</h3>
                    <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest leading-none mt-1">Deduction will sync with payout matrix</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Staff Member</label>
                    <select
                      required
                      value={formData.staffId}
                      onChange={(e) => {
                        const s = staff.find(staff => staff.id === e.target.value);
                        setFormData({ ...formData, staffId: e.target.value, staffName: s?.name || '' });
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="" className="dark:bg-slate-900">Select Staff...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name} ({s.position})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Penalty Date</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Amount ₹</label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-black text-rose-600 dark:text-rose-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reason / Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Glass breakage, late coming..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Checked By (Authority)</label>
                    <select
                      required
                      value={staffNames.includes(formData.checkedBy) ? formData.checkedBy : (formData.checkedBy === "" ? "" : "manual")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "manual") {
                          setFormData({ ...formData, checkedBy: '' });
                        } else {
                          setFormData({ ...formData, checkedBy: val });
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="" className="dark:bg-slate-900">Select Authority...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.name} className="dark:bg-slate-900 font-bold">
                          {s.name} ({s.position})
                        </option>
                      ))}
                      <option value="manual" className="dark:bg-slate-900 text-indigo-500 font-black">--- Manually add name ---</option>
                    </select>

                    {(formData.checkedBy === "" || !staffNames.includes(formData.checkedBy)) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <input
                          type="text"
                          required
                          placeholder="Enter Senior Authority Name"
                          value={formData.checkedBy}
                          onChange={(e) => setFormData({ ...formData, checkedBy: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500/50 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-100 dark:border-slate-800 text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-slate-400 dark:text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-4 bg-slate-900 dark:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-rose-500 shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={18} />
                    Issue Penalty
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
