import React, { useState, useEffect } from 'react';
import { getOfflineQueue, processOfflineQueue } from '@/lib/offlineSync';
import { WifiOff, CloudUpload, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial check
    updateQueueCount();

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await processOfflineQueue();
      setIsSyncing(false);
      updateQueueCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdate = () => {
      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdate);
    };
  }, []);

  const updateQueueCount = () => {
    setQueueCount(getOfflineQueue().length);
  };

  if (isOnline && queueCount === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-500",
        !isOnline 
          ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
          : isSyncing
            ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
      )}>
        {!isOnline ? (
          <>
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide">Offline Mode</span>
              {queueCount > 0 && (
                <span className="text-[10px] uppercase font-bold opacity-70">
                  {queueCount} changes pending sync
                </span>
              )}
            </div>
          </>
        ) : isSyncing ? (
          <>
            <CloudUpload className="w-5 h-5 animate-bounce" />
            <span className="text-sm font-bold tracking-wide">Syncing data...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide">Sync Complete</span>
          </>
        )}
      </div>
    </div>
  );
}
