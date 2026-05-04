/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Denominations, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firebase-utils';
import { Banknote, Calculator, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const DENOM_LABELS = [500, 200, 100, 50, 20, 10, 5] as const;

export default function TipBoxInventory() {
  const [denominations, setDenominations] = useState<Denominations>({
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'inventory', 'current'), (snapshot) => {
      if (snapshot.exists()) {
        setDenominations(snapshot.data().denominations);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventory/current');
    });

    return () => unsubscribe();
  }, []);

  const totalCash = DENOM_LABELS.reduce((acc, label) => acc + (label * denominations[label]), 0);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'inventory', 'current'), {
        denominations,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory/current');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (label: keyof Denominations, value: string) => {
    const num = parseInt(value) || 0;
    setDenominations(prev => ({ ...prev, [label]: num }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center gap-3">
          <Banknote className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tip Box Inventory</h3>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cash</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalCash.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DENOM_LABELS.map((label) => (
            <div key={label} className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-xs font-bold text-gray-500 flex items-center justify-between">
                ₹{label} <span className="font-mono text-gray-400">×</span>
              </label>
              <input
                type="number"
                min="0"
                value={denominations[label] || ''}
                onChange={(e) => handleInputChange(label, e.target.value)}
                onBlur={handleUpdate}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="0"
              />
              <div className="text-[10px] font-mono text-gray-400 text-right">
                = ₹{(label * denominations[label]).toLocaleString()}
              </div>
            </div>
          ))}
          
          <div className="sm:col-span-1 flex flex-col justify-end">
            <button
              onClick={handleUpdate}
              disabled={isSaving}
              className={cn(
                "w-full h-10 rounded-lg font-semibold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2",
                isSaving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/50 flex items-start gap-3">
          <Calculator className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-900">Auto-Calculation Enabled</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Total cash is automatically calculated based on denominations. Changes are saved to Firestore automatically on blur or manual save.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
