import React from 'react';
import EarningsCalculator from '../features/EarningsCalculator';
import TipBoxInventory from '../features/TipBoxInventory';
import { Table } from 'lucide-react';
import { Permissions } from '../../types';

interface DashboardProps {
  permissions: Permissions;
  onNavigateToPayouts: () => void;
}

export default function Dashboard({ permissions, onNavigateToPayouts }: DashboardProps) {
  return (
    <div className="space-y-8">
      <EarningsCalculator permissions={permissions} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TipBoxInventory permissions={permissions} />
        <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl shadow-indigo-200/20">
          <div className="space-y-4">
            <Table className="w-12 h-12 opacity-50" />
            <h3 className="text-2xl font-black tracking-tight">Financial Matrix</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              View detailed settlements, deductions, and final points calculation for all active staff members.
            </p>
          </div>
          <button 
            onClick={onNavigateToPayouts}
            className="mt-6 px-6 py-3 bg-white text-indigo-600 font-black rounded-xl w-fit active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            Launch Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
