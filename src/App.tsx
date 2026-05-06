import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import { usePermissions } from './hooks/usePermissions';

// Lazy load feature components
const Dashboard = lazy(() => import('./components/layout/Dashboard'));
const StaffManager = lazy(() => import('./components/features/StaffManager'));
const AdvanceManager = lazy(() => import('./components/features/AdvanceManager'));
const TipBoxInventory = lazy(() => import('./components/features/TipBoxInventory'));
const PenaltyManager = lazy(() => import('./components/features/PenaltyManager'));
const PayoutMatrix = lazy(() => import('./components/features/PayoutMatrix'));
const UserManager = lazy(() => import('./components/features/UserManager'));
const BackupRestore = lazy(() => import('./components/features/BackupRestore'));

enum ActiveTab {
  Dashboard = 'dashboard',
  Staff = 'staff',
  Advances = 'advances',
  Penalties = 'penalties',
  Inventory = 'inventory',
  Payouts = 'payouts',
  Users = 'users',
  Settings = 'settings'
}

const TAB_TITLES: Record<ActiveTab, string> = {
  [ActiveTab.Dashboard]: 'Core Dashboard',
  [ActiveTab.Staff]: 'Staff Portal',
  [ActiveTab.Advances]: 'Cash Advances',
  [ActiveTab.Penalties]: 'Penalty System',
  [ActiveTab.Inventory]: 'Physical Inventory',
  [ActiveTab.Payouts]: 'Financial Matrix',
  [ActiveTab.Users]: 'Access Management',
  [ActiveTab.Settings]: 'System Control',
};

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Dashboard);
  const { permissions, profile, loading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authenticating Access...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      activeTab={activeTab} 
      onTabChange={(tab) => setActiveTab(tab as ActiveTab)}
      title={TAB_TITLES[activeTab]}
    >
      <Suspense fallback={
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      }>
        {activeTab === ActiveTab.Dashboard && (
          <Dashboard 
            permissions={permissions} 
            onNavigateToPayouts={() => setActiveTab(ActiveTab.Payouts)} 
          />
        )}
        {activeTab === ActiveTab.Staff && <StaffManager permissions={permissions} />}
        {activeTab === ActiveTab.Advances && <AdvanceManager permissions={permissions} />}
        {activeTab === ActiveTab.Penalties && <PenaltyManager permissions={permissions} />}
        {activeTab === ActiveTab.Inventory && <TipBoxInventory permissions={permissions} />}
        {activeTab === ActiveTab.Payouts && <PayoutMatrix user={profile!} permissions={permissions} />}
        {activeTab === ActiveTab.Users && <UserManager permissions={permissions} />}
        {activeTab === ActiveTab.Settings && <BackupRestore permissions={permissions} />}
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
