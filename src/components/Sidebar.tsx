import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  IndianRupee, 
  Banknote, 
  Table, 
  Settings, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  appName: string;
  subtitle: string;
}

export default function Sidebar({ activeTab, onTabChange, isCollapsed, setIsCollapsed, appName, subtitle }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'staff', label: 'Staff Roster', icon: Users },
    { id: 'advances', label: 'Advances', icon: IndianRupee },
    { id: 'inventory', label: 'Cash Entry', icon: Banknote },
    { id: 'payouts', label: 'Payout Matrix', icon: Table },
    { id: 'settings', label: 'App Settings', icon: Settings },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="bg-slate-900 text-slate-300 h-screen sticky top-0 flex flex-col transition-all overflow-hidden z-50 shadow-2xl"
    >
      {/* Brand */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800/50 h-20">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="text-xl font-black text-white tracking-tighter leading-none">{appName}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{subtitle}</span>
          </motion.div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            )}
          >
            <item.icon size={22} className={cn("transition-transform", activeTab === item.id ? "scale-110" : "group-hover:scale-105")} />
            {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>
    </motion.aside>
  );
}
