export enum Position {
  Captain = 'Captain',
  Steward = 'Steward',
  Bartender = 'Bartender',
  Housekeeping = 'Housekeeping',
  Cashier = 'Cashier'
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
  currency: string;
  kitchenMode: 'fixed' | 'percentage';
  kitchenValue: number;
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
  };
  privacyPolicy: string;
  theme: 'light' | 'dark' | 'system';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}
