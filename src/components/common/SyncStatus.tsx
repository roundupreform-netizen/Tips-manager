/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate syncing when online status changes
    if (isOnline) {
      setIsSyncing(true);
      const timer = setTimeout(() => setIsSyncing(false), 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium">
      {isSyncing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
          <span className="text-blue-100">Syncing...</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-green-100">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-100/50" />
          <span className="text-red-100/50">Offline</span>
        </>
      )}
    </div>
  );
}
