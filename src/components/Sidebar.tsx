import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  IndianRupee, 
  Banknote, 
  Table, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import Avatar from './Avatar';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  appName: string;
  subtitle: string;
  user: UserProfile;
  permissions: {
    canSeeAllData: boolean;
    canSeeOwnTips: boolean;
  };
}

export default function Sidebar({ activeTab, onTabChange, isCollapsed, setIsCollapsed, appName, subtitle, user, permissions }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'staff', label: 'Staff Roster', icon: Users, show: permissions.canSeeAllData },
    { id: 'advances', label: 'Advances', icon: IndianRupee, show: permissions.canSeeAllData },
    { id: 'penalties', label: 'Penalties', icon: AlertCircle, show: permissions.canSeeAllData },
    { id: 'inventory', label: 'Cash Entry', icon: Banknote, show: permissions.canSeeAllData },
    { id: 'payouts', label: 'Payout Matrix', icon: Table, show: permissions.canSeeAllData || permissions.canSeeOwnTips },
    { id: 'users', label: 'Staff Management', icon: ShieldCheck, show: permissions.canSeeAllData },
    { id: 'settings', label: 'System Settings', icon: Settings, show: permissions.canSeeAllData },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="bg-slate-900 text-slate-300 h-screen sticky top-0 flex flex-col transition-all overflow-hidden z-50 shadow-2xl border-r border-slate-800"
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
        {menuItems.filter(item => item.show).map((item) => (
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
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

    <div className="p-4 border-t border-slate-800/50">
        {!isCollapsed ? (
          <div className="px-4 py-3 bg-slate-800/30 rounded-2xl flex items-center gap-3 border border-slate-700/30">
            <Avatar name={user.displayName || 'User'} avatar={user.photoURL} size="sm" className="rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-white truncate">{user.displayName || 'User'}</p>
              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <Avatar name={user.displayName || 'User'} avatar={user.photoURL} size="sm" className="rounded-lg" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
