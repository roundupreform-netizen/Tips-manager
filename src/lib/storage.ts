import { User, StaffMember, AdvanceEntry, Denominations, AppSettings, Role, Permissions } from '../types';

const KEYS = {
  USERS: 'tips_users',
  CURRENT_USER: 'tips_current_user',
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

const INITIAL_ADMIN: User = {
  id: 'admin_1',
  name: 'Admin',
  username: 'roundupreform@gmail.com',
  password: 'Tip123@#4',
  role: 'admin',
  active: true,
  permissions: {
    canAddUser: true,
    canEditUser: true,
    canDeleteUser: true,
    canEnableDisable: true,
    canAssignRole: true,
    canSetPassword: true,
    canSeeAllData: true,
    canSeeOwnProfile: true,
    canSeeOwnTips: true,
    canSeeTotalCollection: true,
  },
  avatar: AVATAR_COLORS[0],
  createdAt: new Date().toISOString()
};

export const getDefaultPermissions = (role: Role): Permissions => {
  const perms: Record<Role, Permissions> = {
    admin: {
      canAddUser: true,
      canEditUser: true,
      canDeleteUser: true,
      canEnableDisable: true,
      canAssignRole: true,
      canSetPassword: true,
      canSeeAllData: true,
      canSeeOwnProfile: true,
      canSeeOwnTips: true,
      canSeeTotalCollection: true,
    },
    captain: {
      canAddUser: true,
      canEditUser: true,
      canDeleteUser: true,
      canEnableDisable: true,
      canAssignRole: false, // Keep role assignment restricted to admin only
      canSetPassword: true,
      canSeeAllData: true,
      canSeeOwnProfile: true,
      canSeeOwnTips: true,
      canSeeTotalCollection: true,
    },
    staff: {
      canAddUser: false,
      canEditUser: false,
      canDeleteUser: false,
      canEnableDisable: false,
      canAssignRole: false,
      canSetPassword: false,
      canSeeAllData: false,
      canSeeOwnProfile: true,
      canSeeOwnTips: true,
      canSeeTotalCollection: true,
    }
  };
  return perms[role];
};

export const storage = {
  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    if (!data) {
      const initial = [INITIAL_ADMIN];
      localStorage.setItem(KEYS.USERS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  
  getCurrentUser: (): User => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    if (!data) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(INITIAL_ADMIN));
      return INITIAL_ADMIN;
    }
    return JSON.parse(data);
  },
  setCurrentUser: (user: User | null) => {
    // Keep it always saved or clear it if needed, but primary logic will use INITIAL_ADMIN if null
    if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  },

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
