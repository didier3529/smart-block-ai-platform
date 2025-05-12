"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { MetricsData } from '@/types/common';
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarketMetricsProps {
  data: {
    topGainers: MetricsData[];
    topLosers: MetricsData[];
    marketCap: number;
    volume24h: number;
    dominance: {
      btc: number;
      eth: number;
    };
  };
  isLoading?: boolean;
}

export function MarketMetrics({ data, isLoading }: MarketMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Market Cap</h3>
          <p className="text-2xl font-bold">
            ${(data.marketCap / 1e9).toFixed(2)}B
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">24h Volume</h3>
          <p className="text-2xl font-bold">
            ${(data.volume24h / 1e9).toFixed(2)}B
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Dominance</h3>
          <div className="space-y-2">
            <p>BTC: {data.dominance.btc.toFixed(1)}%</p>
            <p>ETH: {data.dominance.eth.toFixed(1)}%</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Top Gainers</h3>
          <div className="space-y-4">
            {data.topGainers.map((coin) => (
              <div key={coin.label} className="flex justify-between items-center">
                <span>{coin.label}</span>
                <span className="text-green-500">
                  +{coin.change?.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Top Losers</h3>
          <div className="space-y-4">
            {data.topLosers.map((coin) => (
              <div key={coin.label} className="flex justify-between items-center">
                <span>{coin.label}</span>
                <span className="text-red-500">
                  {coin.change?.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 