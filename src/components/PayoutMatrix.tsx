import React, { useState, useEffect, useMemo } from 'react';
import { 
  StaffMember, 
  AdvanceEntry, 
  PenaltyEntry,
  Denominations, 
  AppSettings,
  User,
  Permissions
} from '../types';
import { Share2, Copy, FileText, Download, Lock, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { storage } from '../lib/storage';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

import Avatar from './Avatar';

interface PayoutMatrixProps {
  user: User;
  permissions: Permissions;
}

export default function PayoutMatrix({ user, permissions }: PayoutMatrixProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [advances, setAdvances] = useState<AdvanceEntry[]>([]);
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);
  const [inventory, setInventory] = useState<Denominations | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setStaff(storage.getStaff());
    setAdvances(storage.getAdvances());
    setInventory(storage.getInventory());
    setSettings(storage.getSettings());
    setUsers(storage.getUsers());

    const q = query(collection(db, 'penalties'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PenaltyEntry[];
      setPenalties(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'penalties');
    });

    return () => unsubscribe();
  }, []);

  const matrixData = useMemo(() => {
    if (!inventory || !settings) return [];

    const cashTotal = Object.entries(inventory).reduce((acc, [label, count]) => acc + (parseInt(label) * (count as number)), 0);
    const totalAdvanceAmount = advances.reduce((acc, curr) => acc + curr.amount, 0);
    const grossCollection = cashTotal + totalAdvanceAmount;
    
    const kitchenShare = settings.kitchenMode === 'fixed' 
      ? settings.kitchenValue 
      : (settings.kitchenValue / 100) * grossCollection;

    const netTips = grossCollection - kitchenShare;
    const totalPoints = staff.reduce((acc, curr) => acc + curr.points, 0);
    const pointValue = totalPoints > 0 ? netTips / totalPoints : 0;

    let filteredStaff = staff;
    
    // Permission-based filtering
    if (!permissions.canSeeAllData) {
      if (permissions.canSeeOwnTips) {
        // Only show their own record
        filteredStaff = staff.filter(s => s.name.toLowerCase() === user.name.toLowerCase());
      } else {
        // No permission to see tips
        return [];
      }
    }

    return filteredStaff.map(member => {
      const grossEarnings = member.points * pointValue;
      
      const memberAdvances = advances.filter(a => a.staffId === member.id);
      const totalAdvances = memberAdvances.reduce((acc, curr) => acc + curr.amount, 0);

      const memberPenalties = penalties.filter(p => p.staffId === member.id);
      const totalPenalties = memberPenalties.reduce((acc, curr) => acc + curr.amount, 0);

      const netPayable = grossEarnings - (totalAdvances + totalPenalties);

      return {
        ...member,
        grossEarnings,
        totalAdvances,
        totalPenalties,
        netPayable
      };
    });
  }, [staff, advances, penalties, inventory, settings, user, permissions]);

  const copyToClipboard = () => {
    const text = matrixData.map(d => 
      `${d.name} (${d.position}): Gross ₹${Math.round(d.grossEarnings)} | Adv -₹${d.totalAdvances} | Pen -₹${d.totalPenalties} | Net ₹${Math.round(d.netPayable)}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Report copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-500" size={24} />
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Final Settlement Matrix</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {user.role === 'staff' ? 'Personal Earning Breakdown' : 'Global Earning Breakdown & Integrated Deductions'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.role !== 'staff' && (
            <button 
              onClick={copyToClipboard}
              className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              <Copy size={16} /> Copy Record
            </button>
          )}
          {user.role === 'staff' && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <Lock size={12} /> Read Only
             </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Unit</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pts</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Earnings</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Advance Paid</th>
              <th className="px-6 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Penalty</th>
              <th className="px-6 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">Net Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {matrixData.length > 0 ? matrixData.map((data, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      name={data.name} 
                      avatar={users.find(u => u.name.toLowerCase() === data.name.toLowerCase())?.avatar} 
                      size="sm" 
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{data.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{data.position}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-600">{data.points}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-slate-900">₹{Math.round(data.grossEarnings).toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={cn("font-black", data.totalAdvances > 0 ? "text-indigo-500" : "text-slate-300")}>
                    -₹{data.totalAdvances.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={cn("font-black", data.totalPenalties > 0 ? "text-rose-500" : "text-slate-300")}>
                    -₹{data.totalPenalties.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="bg-emerald-50 px-3 py-1.5 rounded-xl inline-block border border-emerald-100">
                    <span className="font-black text-emerald-700">₹{Math.round(data.netPayable).toLocaleString()}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="space-y-3">
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No matching records active</p>
                    <p className="text-sm text-slate-400">Please ensure your user name matches your staff roster profile.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
