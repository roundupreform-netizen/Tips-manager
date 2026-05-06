export interface RoleConfig {
  id: string;
  name: string;
  permissions: Permissions;
}

export interface Permissions {
  canAddUser: boolean;
  canEditUser: boolean;
  canDeleteUser: boolean;
  canEnableDisable: boolean;
  canAssignRole: boolean;
  canSetPassword: boolean;
  canSeeAllData: boolean;
  canSeeOwnProfile: boolean;
  canSeeOwnTips: boolean;
  canSeeTotalCollection: boolean;
}

export enum Position {
  Captain = 'Captain',
  Steward = 'Steward',
  Bartender = 'Bartender',
  Housekeeping = 'Housekeeping',
  Cashier = 'Cashier'
}

export type Role = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  active: boolean;
  createdAt: any;
  lastLogin: any;
}

export interface StaffMember {
  id: string;
  name: string;
  position: Position;
  points: number;
}

export interface AdvanceEntry {
  id: string;
  staffId: string;
  staffName: string;
  position: string;
  date: string;
  amount: number;
}

export interface PenaltyEntry {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  reason: string;
  amount: number;
  checkedBy: string;
  createdAt: any;
}

export interface Denominations {
  500: number;
  200: number;
  100: number;
  50: number;
  20: number;
  10: number;
  5: number;
}

export interface AppSettings {
  appName: string;
  subtitle: string;
  kitchenMode: 'fixed' | 'percentage';
  kitchenValue: number;
  theme: 'light' | 'dark';
}
