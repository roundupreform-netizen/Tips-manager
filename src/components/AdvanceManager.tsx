/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdvanceEntry, StaffMember, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firebase-utils';
import { Search, Plus, Trash2, Calendar, IndianRupee, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function AdvanceManager() {
  const [advances, setAdvances] = useState<AdvanceEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ staffId: '', amount: 0, date: format(new Date(), "yyyy-MM-dd'T'HH:mm") });

  useEffect(() => {
    // Fetch Staff for selection
    const staffUnsubscribe = onSnapshot(query(collection(db, 'staff')), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffMember[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'staff'));

    // Fetch Advances
    const q = query(collection(db, 'advances'), orderBy('date', 'desc'));
    const advUnsubscribe = onSnapshot(q, (snapshot) => {
      setAdvances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdvanceEntry[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'advances');
    });

    return () => {
      staffUnsubscribe();
      advUnsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || formData.amount <= 0) return;

    const selectedStaff = staff.find(s => s.id === formData.staffId);
    if (!selectedStaff) return;

    try {
      await addDoc(collection(db, 'advances'), {
        staffId: formData.staffId,
        staffName: selectedStaff.name,
        position: selectedStaff.position,
        amount: formData.amount,
        date: formData.date
      });
      setFormData({ staffId: '', amount: 0, date: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'advances');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this advance record?')) return;
    try {
      await deleteDoc(doc(db, 'advances', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `advances/${id}`);
    }
  };

  const filteredAdvances = advances.filter(adv => 
    adv.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adv.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <IndianRupee className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Add Advance</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Staff Member</label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              required
            >
              <option value="">Select Staff</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.position})</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Advances History</h3>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {filteredAdvances.map((adv) => (
                  <motion.tr
                    key={adv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{format(new Date(adv.date), 'MMM dd, HH:mm')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{adv.staffName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-500">{adv.position}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-orange-600">₹{adv.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(adv.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredAdvances.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No advance records match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
