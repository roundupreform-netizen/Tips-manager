import { useState, useEffect } from 'react';
import { firestoreService, COLLECTIONS } from '../services/firestoreService';
import { StaffMember, AdvanceEntry, PenaltyEntry, Denominations, AppSettings, User } from '../types';

export function useRealtimeList<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToList<T>(collectionName, (newData) => {
      setData(newData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
}

export function useRealtimeDoc<T>(collectionName: string, docId: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToDoc<T>(collectionName, docId, (newData) => {
      if (newData) setData(newData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading };
}

export function useStaff() {
  return useRealtimeList<StaffMember>(COLLECTIONS.STAFF);
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
  return useRealtimeList<User>(COLLECTIONS.USERS);
}
