"use client";

import React from 'react';
import { useWebSocket, ConnectionStatus } from '@/lib/providers/websocket-provider';
import { Wifi, WifiOff } from 'lucide-react';
import { WebSocketConfig } from '@/config/websocket-config';
import { cn } from '@/lib/utils';

interface WebSocketStatusProps {
  showDetail?: boolean;
  className?: string;
}

export function WebSocketStatus({ showDetail = false, className }: WebSocketStatusProps) {
  const { isConnected, reconnect } = useWebSocket();
  
  // Show detailed status indicator if requested
  if (showDetail) {
    return <ConnectionStatus />;
  }
  
  // Simple indicator
  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-xs rounded px-2 py-1 transition-colors cursor-pointer",
        isConnected
          ? "text-green-500 hover:text-green-400" 
          : "text-red-500 hover:text-red-400",
        WebSocketConfig.useMock && "border border-blue-500/30 bg-blue-500/10",
        className
      )}
      onClick={reconnect}
      title={isConnected ? "Connected to real-time data" : "Disconnected from real-time data. Click to reconnect."}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          {WebSocketConfig.useMock && (
            <span className="text-blue-400 font-mono">[MOCK]</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
} 