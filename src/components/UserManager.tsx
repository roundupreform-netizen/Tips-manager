import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  UserCircle,
  Lock,
  Search,
  X,
  Check,
  Settings2,
  ShieldAlert,
  Camera,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useUsers } from '../hooks/useRealtimeData';
import { firestoreService } from '../services/firestoreService';
import { getDefaultPermissions, getRandomAvatarColor } from '../lib/storage';
import { User, Role, Permissions } from '../types';
import { Loader2 } from 'lucide-react';
import Avatar from './Avatar';

interface UserManagerProps {
  permissions: Permissions;
}

export default function UserManager({ permissions: currentUserPermissions }: UserManagerProps) {
  const { data: users, loading } = useUsers();
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'staff' as Role,
    active: true,
    permissions: getDefaultPermissions('staff'),
    avatar: getRandomAvatarColor()
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('File size must be less than 2MB');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoleChange = (role: Role) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserPermissions.canAddUser && !editingUser) return;
    if (!currentUserPermissions.canEditUser && editingUser) return;

    if (editingUser) {
      await firestoreService.saveUser({ ...editingUser, ...formData });
    } else {
      const newUser: User = {
        ...formData,
        id: `user_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      await firestoreService.saveUser(newUser);
    }

    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!currentUserPermissions.canDeleteUser) return;
    if (id === 'admin_1') return alert('Cannot delete the primary admin account.');
    if (!confirm('Are you sure you want to delete this user?')) return;
    await firestoreService.deleteUser(id);
  };

  const toggleStatus = async (user: User) => {
    if (!currentUserPermissions.canEnableDisable) return;
    if (user.id === 'admin_1') return;
    await firestoreService.saveUser({ ...user, active: !user.active });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const resetForm = () => {
    setIsAdding(false);
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      role: 'staff',
      active: true,
      permissions: getDefaultPermissions('staff'),
      avatar: getRandomAvatarColor()
    });
  };

  const startEdit = (user: User) => {
    if (!currentUserPermissions.canEditUser) return;
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      permissions: user.permissions || getDefaultPermissions(user.role),
      avatar: user.avatar || getRandomAvatarColor()
    });
    setIsAdding(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePermission = (key: keyof Permissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  if (!currentUserPermissions.canSeeAllData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">You do not have the required permissions to manage staff access controls.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Staff Management</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage internal staff accounts and access rights</p>
          </div>
        </div>
        {currentUserPermissions.canAddUser && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center gap-2 active:scale-95"
          >
            <UserPlus size={20} /> Add Staff Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Stats/Filter */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            </div>
            
            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{users.filter(u => u.active).length}</span>
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">Active</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl flex flex-col items-center">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{users.filter(u => !u.active).length}</span>
                <span className="text-[10px] font-black text-rose-800 dark:text-rose-300 uppercase tracking-widest">Disabled</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-[2rem] text-white space-y-4 relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight">Security Protocol</h3>
              <p className="text-slate-100/70 text-sm font-medium leading-relaxed">
                Staff accounts use unique usernames. Administrative accounts should maintain strict password hygiene.
              </p>
            </div>
            <ShieldCheck className="absolute -bottom-4 -right-4 text-slate-800 dark:text-slate-900/50 w-32 h-32 rotate-12" />
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} avatar={user.avatar} size="md" />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          user.role === 'admin' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : 
                          user.role === 'captain' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleStatus(user)}
                          disabled={user.id === 'admin_1' || !currentUserPermissions.canEnableDisable}
                          className={cn(
                            "p-2 rounded-xl transition-all border",
                            user.active 
                              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {user.active ? <UserCheck size={18} /> : <UserX size={18} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentUserPermissions.canEditUser && (
                            <button 
                              onClick={() => startEdit(user)}
                              className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {currentUserPermissions.canDeleteUser && (
                            <button 
                              onClick={() => handleDelete(user.id)}
                              disabled={user.id === 'admin_1'}
                              className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-30"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editingUser ? 'Edit Staff Account' : 'New Staff Account'}</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Define credentials and system role</p>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Avatar Picker */}
                  <div className="flex flex-col items-center justify-center space-y-4 pb-4">
                    <div className="relative group">
                      <Avatar name={formData.name || 'User'} avatar={formData.avatar} size="xl" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 hover:bg-indigo-500 transition-all scale-0 group-hover:scale-100 origin-bottom-right"
                      >
                        <Camera size={14} />
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({...formData, avatar: color})}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all border-2",
                            formData.avatar === color ? "border-slate-900 dark:border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, avatar: getRandomAvatarColor()})}
                        className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-all"
                      >
                        <Palette size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Staff Username / Identifier</label>
                    <div className="relative">
                      <input 
                        required
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="rahul_s"
                      />
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['admin', 'captain', 'staff'] as Role[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          disabled={editingUser && !currentUserPermissions.canAssignRole}
                          onClick={() => handleRoleChange(r)}
                          className={cn(
                            "py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            formData.role === r 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/30",
                            editingUser && !currentUserPermissions.canAssignRole && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                        <Settings2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">User Permissions</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Configure access rights</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPermissionsOpen(true)}
                      className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all font-bold"
                    >
                      Customize
                    </button>
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
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Currently {formData.active ? 'Active' : 'Disabled'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!currentUserPermissions.canEnableDisable}
                      onClick={() => setFormData({...formData, active: !formData.active})}
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
                    onClick={resetForm}
                    className="flex-1 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-widest"
                  >
                    <Check size={20} /> {editingUser ? 'Update Staff' : 'Save Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {isPermissionsOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">User Rights Control</h2>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Assign granular permissions for {formData.name || 'Staff'}</p>
                  </div>
                </div>
                <button onClick={() => setIsPermissionsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 dark:text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(formData.permissions).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePermission(key as keyof Permissions)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                      value 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400" 
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-indigo-100 dark:hover:border-indigo-900/30 font-bold"
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-[8px] font-bold uppercase opacity-60">
                        {value ? 'Permitted' : 'Restricted'}
                      </p>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                      value ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    )}>
                      {value ? <Check size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsPermissionsOpen(false)}
                  className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs"
                >
                  Confirm Permissions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
