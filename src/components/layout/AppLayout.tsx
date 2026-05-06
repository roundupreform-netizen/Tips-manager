import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useSettings } from '../../hooks/useRealtimeData';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { firestoreService } from '../../services/firestoreService';
import { cn } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
}

export default function AppLayout({ children, activeTab, onTabChange, title }: AppLayoutProps) {
  const { data: appSettings, loading: settingsLoading } = useSettings();
  const { theme, toggleTheme, loading: themeLoading } = useTheme();
  const { logout } = useAuth();
  const { permissions, profile, loading: permissionsLoading } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (settingsLoading || permissionsLoading || themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
    )}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        appName={appSettings.appName}
        subtitle={appSettings.subtitle}
        user={profile!}
        permissions={permissions}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className={cn(
          "h-20 px-4 sm:px-8 border-b flex items-center justify-between sticky top-0 md:bg-opacity-80 backdrop-blur-md z-30 transition-colors",
          theme === 'dark' ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-100"
        )}>
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight uppercase">{title}</h2>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              theme === 'dark' ? "text-slate-500" : "text-slate-400"
            )}>
              {appSettings.appName} • {appSettings.subtitle}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2.5 rounded-xl transition-all border",
                theme === 'dark' 
                  ? "bg-slate-800 border-slate-700 text-amber-400" 
                  : "bg-white border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm"
              )}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={logout}
              className={cn(
                "p-2.5 rounded-xl transition-all border",
                theme === 'dark' 
                  ? "bg-slate-800 border-slate-700 text-rose-400" 
                  : "bg-white border-slate-100 text-slate-400 hover:text-rose-600 shadow-sm"
              )}
            >
              <LogOut size={20} />
            </button>
            <div className={cn(
              "hidden sm:block px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase",
              theme === 'dark' ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
            )}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
