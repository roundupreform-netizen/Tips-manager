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
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Role, Permissions } from '../types';

const DEFAULT_ROLES: Record<Role, Permissions> = {
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

  useEffect(() => {
    const initializeSystem = async (firebaseUser: User) => {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setProfile({ ...profileData, uid: firebaseUser.uid });
          await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
        } else {
          const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
          const isFirstUser = usersSnap.empty;

          if (isFirstUser) {
            // Initialize roles
            const batch = writeBatch(db);
            Object.entries(DEFAULT_ROLES).forEach(([roleName, permissions]) => {
              const roleRef = doc(db, 'roles', roleName);
              batch.set(roleRef, { id: roleName, name: roleName, permissions });
            });
            
            // Initialize settings
            const settingsRef = doc(db, 'settings', 'current');
            batch.set(settingsRef, {
              appName: 'Tips Pro',
              subtitle: 'System Control',
              kitchenMode: 'fixed',
              kitchenValue: 0,
              theme: 'light'
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
          setProfile(newProfile);
        }
      } catch (error) {
        console.error('System initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        initializeSystem(firebaseUser);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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
    isStaff: profile?.role === 'staff' || profile?.role === 'manager' || profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
