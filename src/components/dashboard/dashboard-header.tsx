'use client';

import { useDashboard } from './dashboard-context';
import { memo } from 'react';

export const DashboardHeader = memo(function DashboardHeader() {
  const { user, formatAddress } = useDashboard();
  
  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Connected: {formatAddress(user.address)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}); 