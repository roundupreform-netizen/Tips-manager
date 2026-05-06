import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const LoginPage: React.FC = () => {
  const { user, profile, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user && profile) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Zap className="text-blue-600 dark:text-blue-400" size={40} />
          </div>
          
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">
            Tip Manager <span className="text-blue-600">Pro</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12">
            Enterprise Grade Tip Management
          </p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 dark:shadow-blue-900/20 mb-6"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>

          <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            Secure Authentication
          </div>
        </div>

        <div className="mt-8 text-center text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
          &copy; 2026 Roundup Reform • All Rights Reserved
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
