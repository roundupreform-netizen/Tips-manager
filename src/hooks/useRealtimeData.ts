import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService, COLLECTIONS } from '../services/firestoreService';
import { StaffMember, AdvanceEntry, PenaltyEntry, Denominations, AppSettings, UserProfile, RoleConfig } from '../types';

export function useRealtimeList<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      // Small delay to ensure Firestore SDK has internal auth token ready
      const timeoutId = setTimeout(() => {
        if (!auth.currentUser) {
          setData([]);
          setLoading(false);
          return;
        }

        unsubscribe = firestoreService.subscribeToList<T>(collectionName, (newData) => {
          setData(newData);
          setLoading(false);
        });
      }, 50);
      return () => clearTimeout(timeoutId);
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      if (user) {
        setupSubscription();
      } else {
        setData([]);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName]);

  return { data, loading };
}

export function useRealtimeDoc<T>(collectionName: string, docId: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      const timeoutId = setTimeout(() => {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        unsubscribe = firestoreService.subscribeToDoc<T>(collectionName, docId, (newData) => {
          if (newData) setData(newData);
          setLoading(false);
        });
      }, 50);
      return () => clearTimeout(timeoutId);
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }

      if (user) {
        setupSubscription();
      } else {
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, docId]);

  return { data, loading };
}

export function useStaff() {
  return useRealtimeList<StaffMember>(COLLECTIONS.STAFF);
}

export function useDeletedStaff() {
  return useRealtimeList<StaffMember & { deletedAt: any }>(COLLECTIONS.DELETED_STAFF);
}

export function useStaffLogs() {
  return useRealtimeList<any>(COLLECTIONS.STAFF_LOGS);
}

export function useAdvances() {
  return useRealtimeList<AdvanceEntry>(COLLECTIONS.ADVANCES);
}

export function usePenalties() {
  return useRealtimeList<PenaltyEntry>(COLLECTIONS.PENALTIES);
}

export function useInventory() {
  return useRealtimeDoc<Denominations>(COLLECTIONS.INVENTORY, 'current', {
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0
  });
}

export function useSettings() {
  return useRealtimeDoc<AppSettings>(COLLECTIONS.SETTINGS, 'current', {
    appName: 'Tips Pro',
    subtitle: 'By Everest Developers',
    kitchenMode: 'fixed',
    kitchenValue: 0,
    theme: 'light'
  });
}

export function useUsers() {
  return useRealtimeList<UserProfile>(COLLECTIONS.USERS);
}

export function useRoles() {
  return useRealtimeList<RoleConfig>(COLLECTIONS.ROLES);
}
