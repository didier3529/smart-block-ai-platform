"use client";

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function NetworkStatusMonitor() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-lg z-50">
      <WifiOff className="h-5 w-5" />
      <span>You are offline. Some features may be limited.</span>
    </div>
  );
} 