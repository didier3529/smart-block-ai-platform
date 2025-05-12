"use client"

import { usePortfolio } from '@/hooks/use-portfolio';
import { formatCurrency } from '@/lib/utils';
import { Button } from '../ui/button';
import { Icons } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';
import { Download, Plus } from 'lucide-react';

const DEFAULT_TIMEFRAME = "1w";
const DEFAULT_NETWORK = "ethereum";

export function PortfolioHeader() {
  const { summary, tokens, isLoading } = usePortfolio({ timeframe: DEFAULT_TIMEFRAME, network: DEFAULT_NETWORK });

  if (isLoading) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[100px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
    );
  }

  const percentageChange = summary?.percentChange24h || 0;
  const isPositive = percentageChange >= 0;

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
          {formatCurrency(summary?.totalValue || 0)}
          <span
            className={`text-lg ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}
            {percentageChange.toFixed(2)}%
          </span>
        </h1>
        <p className="text-muted-foreground">
          {summary?.assetsCount || 0} assets across {summary?.networksCount || 0} networks
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button
          size="sm"
          className="h-9 bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>
    </div>
  );
} 