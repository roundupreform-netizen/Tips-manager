/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  StaffMember, 
  AdvanceEntry, 
  Denominations, 
  AppSettings,
  OperationType 
} from '../types';
import { handleFirestoreError } from '../lib/firebase-utils';
import { Share2, Copy, FileText, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function PayoutMatrix() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [advances, setAdvances] = useState<AdvanceEntry[]>([]);
  const [inventory, setInventory] = useState<Denominations | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ 
    appName: 'Tips Manager',
    subtitle: 'By Everest Developers',
    currency: '₹',
    kitchenMode: 'fixed', 
    kitchenValue: 0,
    contact: { phone: '', email: '', whatsapp: '', address: '' },
    privacyPolicy: '',
    theme: 'system'
  });

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'staff'), 
      (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() })) as StaffMember[]),
      (e) => handleFirestoreError(e, OperationType.GET, 'staff')
    );
    const unsubAdv = onSnapshot(collection(db, 'advances'), 
      (s) => setAdvances(s.docs.map(d => ({ id: d.id, ...d.data() })) as AdvanceEntry[]),
      (e) => handleFirestoreError(e, OperationType.GET, 'advances')
    );
    const unsubInv = onSnapshot(doc(db, 'inventory', 'current'), 
      (s) => s.exists() && setInventory(s.data().denominations),
      (e) => handleFirestoreError(e, OperationType.GET, 'inventory/current')
    );
    const unsubSet = onSnapshot(doc(db, 'settings', 'current'), 
      (s) => {
        if (s.exists()) {
          const data = s.data();
          setSettings(prev => ({
            ...prev,
            kitchenMode: data.kitchenMode || 'fixed',
            kitchenValue: data.kitchenValue !== undefined ? data.kitchenValue : 0
          }));
        }
      },
      (e) => handleFirestoreError(e, OperationType.GET, 'settings/current')
    );

    return () => {
      unsubStaff(); unsubAdv(); unsubInv(); unsubSet();
    };
  }, []);

  const matrixData = useMemo(() => {
    if (!inventory) return [];

    const cashTotal = Object.entries(inventory).reduce((acc: number, [label, count]) => {
      return acc + (Number(label) * (count as number));
    }, 0);
    const advancesTotal = advances.reduce((acc: number, a) => acc + a.amount, 0);
    const totalCollection = cashTotal + advancesTotal;
    
    const kitchenShare = totalCollection === 0 ? 0 : (
      settings.kitchenMode === 'fixed' 
        ? settings.kitchenValue 
        : (totalCollection * settings.kitchenValue) / 100
    );

    const netEarnings = Math.max(0, totalCollection - kitchenShare);
    
    const totalPoints = staff.reduce((acc: number, s) => acc + s.points, 0);
    const tipPerPoint = totalPoints > 0 ? netEarnings / totalPoints : 0;

    return staff.map(member => {
      const staffAdvances = advances
        .filter(a => a.staffId === member.id)
        .reduce((acc, a) => acc + a.amount, 0);
      
      const earnedTips = member.points * tipPerPoint;
      const finalPay = earnedTips - staffAdvances;

      return {
        id: member.id,
        name: member.name,
        position: member.position,
        points: member.points,
        earnedTips,
        advances: staffAdvances,
        finalPay
      };
    }).sort((a, b) => b.finalPay - a.finalPay);
  }, [staff, advances, inventory, settings]);

  const generateReport = () => {
    if (matrixData.length === 0) return '';
    const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
    let report = `💰 *TIPS DISTRIBUTION REPORT*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━\n\n`;
    
    matrixData.forEach(row => {
      report += `👤 *${row.name}* (${row.position.slice(0,3)})\n`;
      report += `⭐ Points: ${row.points}\n`;
      report += `💵 Earned: ₹${row.earnedTips.toFixed(0)}\n`;
      if (row.advances > 0) report += `📉 Advance: -₹${row.advances.toFixed(0)}\n`;
      report += `✅ *Payable: ₹${row.finalPay.toFixed(0)}*\n`;
      report += `───────────────\n`;
    });

    report += `\n*TOTAL NET: ₹${matrixData.reduce((acc: number, r) => acc + r.earnedTips, 0).toFixed(0)}*`;
    report += `\nBy Everest Developers`;
    return report;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(generateReport());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReport());
    alert('Report copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Final Payout Matrix</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-all active:scale-95"
          >
            <Copy className="w-4 h-4" />
            Copy Text
          </button>
          <button 
            onClick={shareWhatsApp}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold rounded-lg transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Details</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Earned Tips</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Advances</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Final Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matrixData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.name}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">{row.position}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-gray-500 text-sm">{row.points}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-600">₹{row.earnedTips.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-400">
                  {row.advances > 0 ? `-₹${row.advances.toLocaleString()}` : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={cn(
                    "text-lg font-black font-mono",
                    row.finalPay < 0 ? "text-red-500" : "text-green-600"
                  )}>
                    ₹{row.finalPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {matrixData.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p>Complete calculations to see the payout matrix.</p>
          </div>
        )}
      </div>
    </div>
  );
}
