import { StaffMember, AdvanceEntry, Denominations, AppSettings } from '../types';

const KEYS = {
  STAFF: 'tips_staff',
  ADVANCES: 'tips_advances',
  INVENTORY: 'tips_inventory',
  SETTINGS: 'tips_settings',
  THEME: 'tips_theme'
};

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Tips Pro',
  subtitle: 'By Everest Developers',
  kitchenMode: 'fixed',
  kitchenValue: 0,
  theme: 'light'
};

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'
];

export const getRandomAvatarColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

export const storage = {
  // Staff
  getStaff: (): StaffMember[] => {
    const data = localStorage.getItem(KEYS.STAFF);
    return data ? JSON.parse(data) : [];
  },
  saveStaff: (staff: StaffMember[]) => localStorage.setItem(KEYS.STAFF, JSON.stringify(staff)),

  // Advances
  getAdvances: (): AdvanceEntry[] => {
    const data = localStorage.getItem(KEYS.ADVANCES);
    return data ? JSON.parse(data) : [];
  },
  saveAdvances: (advances: AdvanceEntry[]) => localStorage.setItem(KEYS.ADVANCES, JSON.stringify(advances)),

  // Inventory
  getInventory: (): Denominations => {
    const data = localStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0 };
  },
  saveInventory: (inv: Denominations) => localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inv)),

  // Settings
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: AppSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)),

  // Theme
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light';
  },
  setTheme: (theme: 'light' | 'dark') => localStorage.setItem(KEYS.THEME, theme)
};
