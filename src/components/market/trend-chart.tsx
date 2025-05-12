"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendDataPoint {
  timestamp: number;
  value: number;
  volume?: number;
  indicators?: {
    sma?: number;
    ema?: number;
    rsi?: number;
  };
}

interface MarketTrendChartProps {
  data?: TrendDataPoint[];
  timeframe: '1d' | '1w' | '1m' | '3m' | '1y';
  showIndicators?: boolean;
  isLoading?: boolean;
}

export function MarketTrendChart({ data, timeframe, showIndicators, isLoading }: MarketTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-[400px] animate-pulse bg-muted rounded" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No trend data available</p>
        </div>
      </Card>
    );
  }

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (timeframe) {
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1w':
        return date.toLocaleDateString([], { weekday: 'short' });
      case '1m':
        return date.toLocaleDateString([], { day: 'numeric' });
      case '3m':
      case '1y':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <Card className="p-4">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            {showIndicators && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
            )}
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'value') return [`$${value.toLocaleString()}`, 'Price'];
                if (name === 'volume') return [`$${value.toLocaleString()}`, 'Volume'];
                if (name === 'sma') return [`$${value.toLocaleString()}`, 'SMA'];
                if (name === 'ema') return [`$${value.toLocaleString()}`, 'EMA'];
                if (name === 'rsi') return [`${value.toFixed(2)}%`, 'RSI'];
                return [value, name];
              }}
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
            />
            {showIndicators && data[0]?.indicators?.sma && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="indicators.sma"
                stroke="#10B981"
                strokeWidth={1}
                dot={false}
              />
            )}
            {showIndicators && data[0]?.indicators?.ema && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="indicators.ema"
                stroke="#6366F1"
                strokeWidth={1}
                dot={false}
              />
            )}
            {showIndicators && data[0]?.indicators?.rsi && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.rsi"
                stroke="#EC4899"
                strokeWidth={1}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
} 