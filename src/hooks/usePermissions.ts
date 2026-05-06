import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRoles } from './useRealtimeData';
import { Permissions, Role } from '../types';

const INITIAL_PERMISSIONS: Permissions = {
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
};

const FALLBACK_PERMISSIONS: Record<Role, Permissions> = {
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

export function usePermissions() {
  const { profile, loading: authLoading } = useAuth();
  const { data: roles, loading: rolesLoading } = useRoles();

  const permissions = useMemo(() => {
    if (!profile) return INITIAL_PERMISSIONS;
    
    // Attempt to find in dynamic roles
    const roleConfig = roles.find(r => r.id === profile.role);
    
    if (roleConfig) {
      return roleConfig.permissions;
    }

    // Fallback to hardcoded defaults based on role string
    console.warn(`[Permissions] Role config not found for "${profile.role}", using fallbacks.`);
    return FALLBACK_PERMISSIONS[profile.role] || INITIAL_PERMISSIONS;
  }, [profile, roles]);

  return {
    permissions,
    loading: authLoading || rolesLoading,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'manager' || profile?.role === 'admin',
    profile
  };
}
