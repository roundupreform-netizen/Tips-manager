import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, StaffMember, AdvanceEntry, PenaltyEntry, Denominations, AppSettings } from '../types';

export const COLLECTIONS = {
  STAFF: 'staff',
  DELETED_STAFF: 'deleted_staff',
  STAFF_LOGS: 'staff_logs',
  ADVANCES: 'advances',
  PENALTIES: 'penalties',
  INVENTORY: 'inventory',
  SETTINGS: 'settings',
  USERS: 'users'
};

export const firestoreService = {
  // Audit Logs
  logAction: async (staffId: string, staffName: string, action: 'create' | 'update' | 'delete' | 'restore', oldData: any = null, newData: any = null) => {
    try {
      await addDoc(collection(db, COLLECTIONS.STAFF_LOGS), {
        staffId,
        staffName,
        action,
        changedBy: 'Admin', // Placeholder as requested
        timestamp: serverTimestamp(),
        changes: {
          oldData,
          newData
        }
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  },
  // Generic list listener
  subscribeToList: <T>(collectionName: string, callback: (data: T[]) => void) => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    });
  },

  // Generic document listener
  subscribeToDoc: <T>(collectionName: string, docId: string, callback: (data: T | null) => void) => {
    return onSnapshot(doc(db, collectionName, docId), (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    });
  },

  // Staff
  getStaff: async (): Promise<StaffMember[]> => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.STAFF));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.STAFF);
      return [];
    }
  },
  saveStaffMember: async (staff: Omit<StaffMember, 'id'>, id?: string) => {
    try {
      if (id) {
        const oldSnap = await getDoc(doc(db, COLLECTIONS.STAFF, id));
        const oldData = oldSnap.exists() ? oldSnap.data() : null;
        await setDoc(doc(db, COLLECTIONS.STAFF, id), staff);
        await firestoreService.logAction(id, staff.name, 'update', oldData, staff);
      } else {
        const docRef = await addDoc(collection(db, COLLECTIONS.STAFF), staff);
        await firestoreService.logAction(docRef.id, staff.name, 'create', null, staff);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.STAFF);
    }
  },
  deleteStaffMember: async (id: string) => {
    try {
      // Soft delete: Move to deleted_staff
      const snap = await getDoc(doc(db, COLLECTIONS.STAFF, id));
      if (snap.exists()) {
        const staffData = snap.data();
        await setDoc(doc(db, COLLECTIONS.DELETED_STAFF, id), {
          ...staffData,
          deletedAt: serverTimestamp()
        });
        await deleteDoc(doc(db, COLLECTIONS.STAFF, id));
        await firestoreService.logAction(id, staffData.name, 'delete', staffData, null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.STAFF}/${id}`);
    }
  },
  restoreStaffMember: async (id: string) => {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.DELETED_STAFF, id));
      if (snap.exists()) {
        const { deletedAt, ...staffData } = snap.data();
        await setDoc(doc(db, COLLECTIONS.STAFF, id), staffData);
        await deleteDoc(doc(db, COLLECTIONS.DELETED_STAFF, id));
        await firestoreService.logAction(id, staffData.name, 'restore', null, staffData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.STAFF}/${id}`);
    }
  },
  permanentDeleteStaff: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.DELETED_STAFF, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.DELETED_STAFF}/${id}`);
    }
  },
  deleteAllStaff: async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.STAFF));
      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.STAFF);
    }
  },

  // Advances
  saveAdvance: async (advance: Omit<AdvanceEntry, 'id'>) => {
    try {
      await addDoc(collection(db, COLLECTIONS.ADVANCES), {
        ...advance,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.ADVANCES);
    }
  },
  deleteAdvance: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ADVANCES, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.ADVANCES}/${id}`);
    }
  },

  // Penalties
  savePenalty: async (penalty: Omit<PenaltyEntry, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, COLLECTIONS.PENALTIES), {
        ...penalty,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.PENALTIES);
    }
  },
  deletePenalty: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PENALTIES, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.PENALTIES}/${id}`);
    }
  },

  // Inventory
  getInventory: async (): Promise<Denominations | null> => {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.INVENTORY, 'current'));
      return snap.exists() ? (snap.data() as Denominations) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.INVENTORY}/current`);
      return null;
    }
  },
  saveInventory: async (denoms: Denominations) => {
    try {
      await setDoc(doc(db, COLLECTIONS.INVENTORY, 'current'), {
        ...denoms,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.INVENTORY}/current`);
    }
  },

  // Settings
  getSettings: async (): Promise<AppSettings | null> => {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'current'));
      return snap.exists() ? (snap.data() as AppSettings) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.SETTINGS}/current`);
      return null;
    }
  },
  saveSettings: async (settings: Partial<AppSettings>) => {
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'current'), settings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/current`);
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.USERS));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
      return [];
    }
  },
  saveUser: async (user: User) => {
    try {
      const { id, ...data } = user;
      await setDoc(doc(db, COLLECTIONS.USERS, id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.USERS);
    }
  },
  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.USERS}/${id}`);
    }
  }
};
