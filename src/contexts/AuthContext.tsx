import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  query,
  limit,
  getDocs,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Role, Permissions } from '../types';

const INITIAL_ROLES: Record<Role, Permissions> = {
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
  manager: {
    canAddUser: false,
    canEditUser: false,
    canDeleteUser: false,
    canEnableDisable: false,
    canAssignRole: false,
    canSetPassword: false,
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
    canSeeTotalCollection: false,
  },
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeSystem = async (firebaseUser: User) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      // Bootstrap Logic: Check if this is the first user
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
      const isFirstUser = usersSnap.empty;

      if (isFirstUser) {
        console.log('[DEBUG] First user detected! Seeding initial data...');
        const batch = writeBatch(db);
        
        // Seed roles if they don't exist
        Object.entries(INITIAL_ROLES).forEach(([roleId, permissions]) => {
          const roleRef = doc(db, 'roles', roleId);
          batch.set(roleRef, { id: roleId, name: roleId, permissions });
        });
        
        // Seed initial settings
        const settingsRef = doc(db, 'settings', 'current');
        batch.set(settingsRef, {
          appName: 'Tips Matrix',
          subtitle: 'System Control',
          kitchenMode: 'fixed',
          kitchenValue: 0,
          theme: 'dark'
        });
        
        await batch.commit();
      }

      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: isFirstUser ? 'admin' : 'staff',
        active: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(userDocRef, newProfile);
      console.log('[DEBUG] Created new profile:', newProfile);
      // The onSnapshot listener will pick this up automatically
    } catch (error) {
      console.error('[DEBUG] Profile creation error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (firebaseUser) {
        console.log('[DEBUG] Auth state changed: User logged in', firebaseUser.uid);
        
        // Use realtime listener for user profile
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            console.log('[DEBUG] Realtime Profile Update:', profileData);
            setProfile({ ...profileData, uid: firebaseUser.uid });
            setLoading(false);
            
            // Background update of last login (only once per session or periodically)
            // For simplicity, we just do it here if needed
          } else {
            console.log('[DEBUG] No profile found for UID:', firebaseUser.uid, 'Starting bootstrap...');
            // Need to create the profile
            await initializeSystem(firebaseUser);
          }
        }, (error) => {
          console.error('[DEBUG] Profile snapshot error:', error);
          setLoading(false);
        });
      } else {
        console.log('[DEBUG] Auth state changed: User logged out');
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    logout,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'manager' || profile?.role === 'admin',
    isStaff: !!profile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be internally scoped');
  return context;
};
