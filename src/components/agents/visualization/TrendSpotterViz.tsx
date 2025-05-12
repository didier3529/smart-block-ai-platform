import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendSpotterResult } from '@/types/agents';

interface TrendSpotterVizProps {
  data: TrendSpotterResult;
}

export function TrendSpotterViz({ data }: TrendSpotterVizProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Trend Analysis</CardTitle>
          <div className="flex gap-2">
            <Badge variant={data.trendDirection === 'up' ? 'success' : 'danger'}>
              {data.trendDirection === 'up' ? 'Bullish' : 'Bearish'}
            </Badge>
            <Badge variant="outline">Confidence: {data.confidence}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#82ca9d"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-4">
                {data.indicators.map((indicator, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>{indicator.name}</span>
                    <Badge variant={indicator.signal === 'buy' ? 'success' : 'danger'}>
                      {indicator.signal}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Overall Sentiment</span>
                <Badge variant={data.sentiment.score > 0.5 ? 'success' : 'danger'}>
                  {data.sentiment.score > 0.5 ? 'Positive' : 'Negative'}
                </Badge>
              </div>
              <div className="space-y-2">
                {data.sentiment.factors.map((factor, index) => (
                  <div key={index} className="text-sm">
                    • {factor}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 