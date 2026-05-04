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
import { storage } from '../lib/storage';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import { format } from 'date-fns';

interface PenaltyManagerProps {
  permissions: Permissions;
}

export default function PenaltyManager({ permissions }: PenaltyManagerProps) {
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    amount: '',
    checkedBy: ''
  });

  useEffect(() => {
    setStaff(storage.getStaff());

    const q = query(collection(db, 'penalties'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PenaltyEntry[];
      setPenalties(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'penalties');
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canSeeAllData) return;
    if (!formData.staffId || !formData.amount || !formData.reason || !formData.checkedBy) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'penalties'), {
        staffId: formData.staffId,
        staffName: formData.staffName,
        date: formData.date,
        reason: formData.reason,
        amount: parseFloat(formData.amount),
        checkedBy: formData.checkedBy,
        createdAt: serverTimestamp()
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
      handleFirestoreError(error, OperationType.CREATE, 'penalties');
    }
  };

  const handleDelete = async (id: string) => {
    if (!permissions.canSeeAllData) return;
    if (!confirm('Are you sure you want to delete this penalty record?')) return;

    try {
      await deleteDoc(doc(db, 'penalties', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `penalties/${id}`);
    }
  };

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
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest italic font-mono">Total Deductions</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Total</p>
              <h3 className="text-2xl font-black tracking-tight text-rose-600">₹{totalPenaltiesAmount.toLocaleString()}</h3>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={12} />
              Staff Wise Breakdown
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(staffSummary).length > 0 ? (
                Object.entries(staffSummary).map(([name, amount], i) => (
                  <div key={i} className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 group hover:border-indigo-200 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-none mb-1">{name}</p>
                      <p className="text-sm font-black text-slate-800">₹{amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest py-2">No individual data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {permissions.canSeeAllData && (
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 tracking-tighter italic">Penalty Management</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time tracking of staff penalties</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
          >
            <Plus size={16} />
            Add Penalty
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 shadow-sm"
          />
        </div>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-600 shadow-sm appearance-none"
          >
            <option value="">Filter by Staff Member...</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Checked By</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount ₹</th>
                {permissions.canSeeAllData && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredPenalties.map((penalty) => (
                  <motion.tr 
                    key={penalty.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-slate-50 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{format(new Date(penalty.date), 'dd MMM yyyy')}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">{format(new Date(penalty.date), 'EEEE')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-[10px]">
                          {penalty.staffName.charAt(0)}
                        </div>
                        <span className="font-extrabold text-slate-800">{penalty.staffName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <FileText size={14} className="text-slate-300" />
                        <span className="text-xs font-semibold">{penalty.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck size={14} className="opacity-60" />
                        <span className="text-xs font-black uppercase tracking-tight">{penalty.checkedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "font-black transition-transform group-hover:scale-110 duration-200",
                          penalty.amount >= 500 ? "text-rose-600" : "text-slate-700"
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
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
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
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 italic tracking-tighter">Add New Penalty</h3>
                    <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest leading-none mt-1">Deduction will sync with payout matrix</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Member</label>
                    <select
                      required
                      value={formData.staffId}
                      onChange={(e) => {
                        const s = staff.find(staff => staff.id === e.target.value);
                        setFormData({ ...formData, staffId: e.target.value, staffName: s?.name || '' });
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                    >
                      <option value="">Select Staff...</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.position})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penalty Date</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount ₹</label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-black text-rose-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason / Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Glass breakage, late coming..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Checked By</label>
                    <input
                      type="text"
                      required
                      placeholder="Senior Authority Name"
                      value={formData.checkedBy}
                      onChange={(e) => setFormData({ ...formData, checkedBy: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-100 text-slate-400 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[1.5] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
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
