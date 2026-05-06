import React, { useState } from 'react';
import { 
  Users, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Search,
  X,
  Check,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useUsers, useRoles } from '../../hooks/useRealtimeData';
import { firestoreService } from '../../services/firestoreService';
import { UserProfile, Role, Permissions, RoleConfig } from '../../types';
import Avatar from '../common/Avatar';

interface UserManagerProps {
  permissions: Permissions;
}

const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  canAddUser: 'Add Users',
  canEditUser: 'Edit Users',
  canDeleteUser: 'Delete Users',
  canEnableDisable: 'Enable/Disable Users',
  canAssignRole: 'Assign Roles',
  canSetPassword: 'Set Passwords',
  canSeeAllData: 'View All Data',
  canSeeOwnProfile: 'View Own Profile',
  canSeeOwnTips: 'View Own Tips',
  canSeeTotalCollection: 'View Total Collection',
};

export default function UserManager({ permissions }: UserManagerProps) {
  const { data: users, loading: usersLoading } = useUsers();
  const { data: roles, loading: rolesLoading } = useRoles();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<{ role: Role; active: boolean }>({
    role: 'staff',
    active: true
  });

  const loading = usersLoading || rolesLoading;

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!permissions.canEditUser) return;

    await firestoreService.saveUserProfile({
      ...editingUser,
      role: formData.role,
      active: formData.active
    });

    setEditingUser(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    if (!permissions.canAssignRole) return;

    await firestoreService.saveRole(editingRole);
    setEditingRole(null);
  };

  const togglePermission = (key: keyof Permissions) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      permissions: {
        ...editingRole.permissions,
        [key]: !editingRole.permissions[key]
      }
    });
  };

  const handleDelete = async (uid: string) => {
    if (!permissions.canDeleteUser) return;
    if (!confirm('Are you sure you want to delete this user profile? This won\'t delete their Google account, but they will lose access.')) return;
    await firestoreService.deleteUserProfile(uid);
  };

  const toggleStatus = async (user: UserProfile) => {
    if (!permissions.canEnableDisable) return;
    await firestoreService.saveUserProfile({ ...user, active: !user.active });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const startEdit = (user: UserProfile) => {
    if (!permissions.canEditUser) return;
    setEditingUser(user);
    setFormData({
      role: user.role,
      active: user.active
    });
  };

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!permissions.canSeeAllData && !permissions.canSeeTotalCollection) {
    // Basic permissions check - only managers/admins should see this
  }

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Identity & Access</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage user profiles and system access</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-[2rem] text-white space-y-4 relative overflow-hidden shadow-xl">
              <div className="relative z-10 space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Protocol Shield</h3>
                <p className="text-slate-100/70 text-sm font-medium leading-relaxed">
                  Authentication is managed via Google identity, while authorization is enforced through the system's role configuration.
                </p>
              </div>
              <ShieldCheck className="absolute -bottom-4 -right-4 text-slate-800 dark:text-slate-900/50 w-32 h-32 rotate-12" />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Profile</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Identity</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.displayName || 'User'} avatar={u.photoURL} size="md" />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white capitalize">{u.displayName || 'Anonymous User'}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            u.role === 'admin' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : 
                            u.role === 'manager' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleStatus(u)}
                            disabled={!permissions.canEnableDisable}
                            className={cn(
                              "p-2 rounded-xl transition-all border",
                              u.active 
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                            )}
                          >
                            {u.active ? <UserCheck size={18} /> : <UserX size={18} />}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {permissions.canEditUser && (
                              <button 
                                onClick={() => startEdit(u)}
                                className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {permissions.canDeleteUser && (
                              <button 
                                onClick={() => handleDelete(u.uid)}
                                className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">
                          No user profiles discovered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Role Protocol</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Configure global permissions for each role</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['admin', 'manager', 'staff'] as Role[]).map((roleName) => {
            const roleConfig = roles.find(r => r.name === roleName);
            return (
              <div key={roleName} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{roleName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission Set</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (!permissions.canAssignRole) return;
                      setEditingRole(roleConfig || { 
                        id: roleName, 
                        name: roleName, 
                        permissions: { 
                          canAddUser: false, 
                          canEditUser: false, 
                          canDeleteUser: false, 
                          canEnableDisable: false, 
                          canAssignRole: false, 
                          canSetPassword: false, 
                          canSeeAllData: false, 
                          canSeeOwnProfile: true, 
                          canSeeOwnTips: true, 
                          canSeeTotalCollection: false 
                        } 
                      });
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>

                <div className="space-y-2 relative z-10">
                  {Object.entries(roleConfig?.permissions || {}).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", value ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")} />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                        {PERMISSION_LABELS[key as keyof Permissions] || key}
                      </span>
                    </div>
                  ))}
                  <p className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest pt-2">
                    +{Math.max(0, Object.keys(roleConfig?.permissions || {}).length - 4)} More...
                  </p>
                </div>
                
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 dark:bg-slate-800/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Modify Access</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{editingUser.displayName}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['admin', 'manager', 'staff'] as Role[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          disabled={!permissions.canAssignRole}
                          onClick={() => setFormData(prev => ({ ...prev, role: r }))}
                          className={cn(
                            "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            formData.role === r 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/30",
                            !permissions.canAssignRole && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        formData.active ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                      )}>
                        {formData.active ? <UserCheck size={20} /> : <UserX size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Account Status</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                          Currently {formData.active ? 'Active' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!permissions.canEnableDisable}
                      onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1 disabled:opacity-50",
                        formData.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                        formData.active ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest"
                  >
                    <Check size={20} /> Apply Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Control Policy</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Defining permissions for <span className="text-indigo-500 uppercase font-black">{editingRole.name}</span></p>
                </div>
                <button onClick={() => setEditingRole(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof Permissions>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePermission(key)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                        editingRole.permissions[key]
                          ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30"
                          : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        {PERMISSION_LABELS[key]}
                      </span>
                      <div className={cn(
                        "w-10 h-5 rounded-full transition-all relative flex items-center px-1",
                        editingRole.permissions[key] ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      )}>
                        <div className={cn(
                          "w-3 h-3 bg-white rounded-full shadow-sm transition-all",
                          editingRole.permissions[key] ? "translate-x-5" : "translate-x-0"
                        )} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="flex-1 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest"
                  >
                    <Check size={20} /> Update Policy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
