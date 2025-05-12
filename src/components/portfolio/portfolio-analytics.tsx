import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioAnalyticsProps {
  timeframe?: '1d' | '1w' | '1m' | '3m' | '1y';
  network?: string;
}

interface AnalyticsData {
  totalValue: number;
  valueChange24h: number;
  valueChangePercent24h: number;
  profitLoss: {
    realized: number;
    unrealized: number;
  };
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    beta: number;
  };
}

export function PortfolioAnalytics({ timeframe = '1d', network = 'ethereum' }: PortfolioAnalyticsProps) {
  const { data: portfolioData, isLoading } = usePortfolio({ timeframe, network });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-4 w-[80px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No portfolio data available</p>
        </CardContent>
      </Card>
    );
  }

  const analytics: AnalyticsData = {
    totalValue: portfolioData.totalValue,
    valueChange24h: portfolioData.valueChange24h,
    valueChangePercent24h: portfolioData.valueChangePercent24h,
    profitLoss: {
      realized: portfolioData.profitLoss?.realized || 0,
      unrealized: portfolioData.profitLoss?.unrealized || 0,
    },
    performance: {
      daily: portfolioData.performance?.daily || 0,
      weekly: portfolioData.performance?.weekly || 0,
      monthly: portfolioData.performance?.monthly || 0,
      yearly: portfolioData.performance?.yearly || 0,
    },
    riskMetrics: {
      volatility: portfolioData.riskMetrics?.volatility || 0,
      sharpeRatio: portfolioData.riskMetrics?.sharpeRatio || 0,
      beta: portfolioData.riskMetrics?.beta || 0,
    },
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</div>
            <div className={cn(
              "flex items-center text-sm",
              analytics.valueChangePercent24h >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {analytics.valueChangePercent24h >= 0 ? (
                <ArrowUp className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDown className="mr-1 h-4 w-4" />
              )}
              {formatPercentage(Math.abs(analytics.valueChangePercent24h))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.profitLoss.realized + analytics.profitLoss.unrealized)}
            </div>
            <div className="text-sm text-muted-foreground">
              Realized: {formatCurrency(analytics.profitLoss.realized)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics.performance.monthly)}</div>
            <div className="text-sm text-muted-foreground">
              YTD: {formatPercentage(analytics.performance.yearly)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics.riskMetrics.volatility)}</div>
            <div className="text-sm text-muted-foreground">
              Sharpe: {analytics.riskMetrics.sharpeRatio.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 