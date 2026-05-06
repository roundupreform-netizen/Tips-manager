import { useEffect } from 'react';
import { useSettings } from './useRealtimeData';
import { firestoreService } from '../services/firestoreService';

export function useTheme() {
  const { data: settings, loading } = useSettings();

  useEffect(() => {
    if (loading) return;
    
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme, loading]);

  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    try {
      await firestoreService.saveSettings({ theme: newTheme });
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  };

  return {
    theme: settings.theme,
    isDark: settings.theme === 'dark',
    toggleTheme,
    loading
  };
}
