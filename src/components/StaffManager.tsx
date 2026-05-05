import React, { useState, useEffect } from 'react';
import { StaffMember, Position, Permissions } from '../types';
import { Plus, Edit2, Trash2, UserPlus, Users, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStaff } from '../hooks/useRealtimeData';
import { firestoreService } from '../services/firestoreService';

interface StaffManagerProps {
  permissions: Permissions;
}

export default function StaffManager({ permissions }: StaffManagerProps) {
  const { data: staff, loading } = useStaff();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', position: Position.Steward, points: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canSeeAllData) return;
    if (!formData.name || formData.points <= 0) return;

    if (isEditing) {
      await firestoreService.saveStaffMember(formData, isEditing);
    } else {
      await firestoreService.saveStaffMember(formData);
    }

    setFormData({ name: '', position: Position.Steward, points: 1 });
    setIsEditing(null);
  };

  const handleEdit = (member: StaffMember) => {
    if (!permissions.canSeeAllData) return;
    setIsEditing(member.id);
    setFormData({ name: member.name, position: member.position, points: member.points });
  };

  const handleDelete = async (id: string) => {
    if (!permissions.canSeeAllData) return;
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    await firestoreService.deleteStaffMember(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Registration Form - Only for those with see all data (Admin/Captain) */}
      {permissions.canSeeAllData || isEditing ? (
        <div className={cn(
          "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-all",
          isEditing && "ring-2 ring-blue-500 border-transparent"
        )}>
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isEditing ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            )}>
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                {isEditing ? 'Update Profile' : 'Register New Staff'}
              </h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee Personal Record</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Staff Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Designation</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as Position })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none text-slate-800 dark:text-white"
              >
                {Object.values(Position).map((pos) => (
                  <option key={pos} value={pos} className="dark:bg-slate-800">{pos}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tip Points</label>
              <input
                type="number"
                step="0.5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 dark:bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <Plus size={18} /> {isEditing ? 'Update' : 'Add Staff'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setFormData({ name: '', position: Position.Steward, points: 1 });
                  }}
                  className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-slate-400 dark:text-slate-500" size={20} />
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Active Roster</h3>
          </div>
          <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {staff.length} Members
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Staff Information</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Designation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Points</th>
                {permissions.canSeeAllData && (
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Settings</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {staff.map((member) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={member.id} 
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        {member.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-blue-600 dark:text-blue-400">{member.points}</span>
                    </td>
                    {permissions.canSeeAllData && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all sm:translate-x-2 sm:group-hover:translate-x-0">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
