/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Denominations, 
  StaffMember, 
  AdvanceEntry, 
  OperationType 
} from '../types';
import { handleFirestoreError } from '../lib/firebase-utils';
import { Percent, Wallet, Scissors, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function EarningsCalculator() {
  const [kitchenMode, setKitchenMode] = useState<'fixed' | 'percentage'>('fixed');
  const [kitchenValue, setKitchenValue] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [advancesTotal, setAdvancesTotal] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    // Sync settings
    const settingsUnsub = onSnapshot(
      doc(db, 'settings', 'current'), 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.kitchenMode) setKitchenMode(data.kitchenMode);
          if (data.kitchenValue !== undefined) setKitchenValue(data.kitchenValue);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/current')
    );

    // Sync inventory total
    const inventoryUnsub = onSnapshot(
      doc(db, 'inventory', 'current'), 
      (snapshot) => {
        if (snapshot.exists()) {
          const denoms = snapshot.data().denominations as Denominations;
          const total = Object.entries(denoms).reduce((acc, [label, count]) => acc + (parseInt(label) * count), 0);
          setCashTotal(total);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'inventory/current')
    );

    // Sync advances total
    const advancesUnsub = onSnapshot(
      collection(db, 'advances'), 
      (snapshot) => {
        const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
        setAdvancesTotal(total);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'advances')
    );

    // Sync staff points total
    const staffUnsub = onSnapshot(
      collection(db, 'staff'), 
      (snapshot) => {
        const total = snapshot.docs.reduce((acc, doc) => acc + (doc.data().points || 0), 0);
        setTotalPoints(total);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'staff')
    );

    return () => {
      settingsUnsub();
      inventoryUnsub();
      advancesUnsub();
      staffUnsub();
    };
  }, []);

  const handleUpdateSettings = async (mode: 'fixed' | 'percentage', value: number) => {
    setKitchenMode(mode);
    setKitchenValue(value);
    try {
      await setDoc(doc(db, 'settings', 'current'), { 
        kitchenMode: mode, 
        kitchenValue: value 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/current');
    }
  };

  const totalCollection = cashTotal + advancesTotal;
  
  const kitchenShareAmount = totalCollection === 0 ? 0 : (
    kitchenMode === 'fixed' 
      ? kitchenValue 
      : (totalCollection * kitchenValue) / 100
  );
  
  const netEarnings = Math.max(0, totalCollection - kitchenShareAmount);
  const tipPerPoint = totalPoints > 0 ? netEarnings / totalPoints : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Earnings Summary</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3 h-3 text-blue-500" /> Cash in Box
            </p>
            <p className="text-2xl font-bold text-gray-900">₹{cashTotal.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-orange-500" /> Total Advances
            </p>
            <p className="text-2xl font-bold text-gray-900">₹{advancesTotal.toLocaleString()}</p>
          </div>

          <div className="space-y-1 p-3 bg-green-50 rounded-xl border border-green-100">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Gross Collection</p>
            <p className="text-2xl font-black text-green-700">₹{totalCollection.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-500" /> Kitchen Share Config
            </label>
            
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => handleUpdateSettings('fixed', kitchenValue)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  kitchenMode === 'fixed' 
                    ? "bg-white text-purple-600 shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                Fixed ₹
              </button>
              <button
                onClick={() => handleUpdateSettings('percentage', kitchenValue)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  kitchenMode === 'percentage' 
                    ? "bg-white text-purple-600 shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                Percentage %
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  {kitchenMode === 'fixed' ? 'Enter Amount' : 'Set Percentage'}
                </span>
                <span className="text-sm font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {kitchenMode === 'percentage' 
                    ? `${kitchenValue}% = -₹${kitchenShareAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : `-₹${kitchenValue.toLocaleString()}`
                  }
                </span>
              </div>
              
              {kitchenMode === 'fixed' ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={kitchenValue || ''}
                    onChange={(e) => handleUpdateSettings('fixed', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-700"
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={kitchenValue || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val)) handleUpdateSettings('percentage', 0);
                        else handleUpdateSettings('percentage', Math.min(50, Math.max(0, val)));
                      }}
                      className="w-full pr-12 pl-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-700"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {[5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleUpdateSettings('percentage', pct)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                          kitchenValue === pct 
                            ? "bg-purple-600 border-purple-600 text-white shadow-sm" 
                            : "bg-white border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600"
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-[10px] text-gray-400 italic">
                Most restaurants use fixed kitchen share daily.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tips Per Point</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600">₹{tipPerPoint.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className="text-xs font-medium text-gray-400">/ point</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-2xl shadow-xl p-6 text-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold">Net Distribution</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Net Earnings (Total - Kitchen)</p>
              <p className="text-4xl font-black">₹{netEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200">Total Staff Points</span>
                <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded">{totalPoints.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-200 text-xs">A single point is worth</span>
                <span className="font-mono font-bold">₹{tipPerPoint.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-3">
          <div className="p-1.5 bg-yellow-400 rounded-full">
            <Info className="w-3 h-3 text-indigo-900" />
          </div>
          <p className="text-[10px] text-indigo-100 leading-tight">
            Final pay is calculated by multiplying points with tip-per-point and subtracting staff advances.
          </p>
        </div>
      </div>
    </div>
  );
}
