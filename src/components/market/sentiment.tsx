"use client"

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SentimentData {
  overall: number;
  social: number;
  news: number;
  technical: number;
  onChain: number;
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sources: Array<{
    name: string;
    sentiment: number;
    volume: number;
  }>;
}

interface MarketSentimentProps {
  data?: SentimentData;
  isLoading?: boolean;
}

export function MarketSentiment({ data, isLoading }: MarketSentimentProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-4">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No sentiment data available</p>
        </div>
      </Card>
    );
  }

  const getSentimentColor = (value: number): string => {
    if (value >= 60) return 'text-green-500';
    if (value >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSentimentLabel = (value: number): string => {
    if (value >= 60) return 'Bullish';
    if (value >= 40) return 'Neutral';
    return 'Bearish';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Overall Sentiment</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Market Sentiment</span>
              <span className={`font-medium ${getSentimentColor(data.overall)}`}>
                {getSentimentLabel(data.overall)}
              </span>
            </div>
            <Progress value={data.overall} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-500">{data.breakdown.positive}%</div>
                <div className="text-muted-foreground">Positive</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-500">{data.breakdown.neutral}%</div>
                <div className="text-muted-foreground">Neutral</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-500">{data.breakdown.negative}%</div>
                <div className="text-muted-foreground">Negative</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Sentiment Sources</h3>
          <div className="space-y-4">
            {data.sources.map((source) => (
              <div key={source.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{source.name}</span>
                  <span className={`text-sm ${getSentimentColor(source.sentiment)}`}>
                    {getSentimentLabel(source.sentiment)}
                  </span>
                </div>
                <Progress value={source.sentiment} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Volume: {source.volume.toLocaleString()} mentions
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Social Sentiment</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Twitter & Reddit</span>
              <span className={`font-medium ${getSentimentColor(data.social)}`}>
                {getSentimentLabel(data.social)}
              </span>
            </div>
            <Progress value={data.social} className="h-2" />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">News Sentiment</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Media Coverage</span>
              <span className={`font-medium ${getSentimentColor(data.news)}`}>
                {getSentimentLabel(data.news)}
              </span>
            </div>
            <Progress value={data.news} className="h-2" />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Technical Sentiment</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Market Indicators</span>
              <span className={`font-medium ${getSentimentColor(data.technical)}`}>
                {getSentimentLabel(data.technical)}
              </span>
            </div>
            <Progress value={data.technical} className="h-2" />
          </div>
        </Card>
      </div>
    </div>
  );
} 