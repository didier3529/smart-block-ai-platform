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
import { Progress } from '@/components/ui/progress';
import { NFTAnalysis } from '@/types/agents';

interface NFTAdvisorVizProps {
  data: NFTAnalysis;
}

export function NFTAdvisorViz({ data }: NFTAdvisorVizProps) {
  const recommendation = data.recommendations[0]; // Primary recommendation

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collection Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Floor Price</p>
                  <p className="text-2xl font-bold">
                    {data.collection.floorPrice} ETH
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-2xl font-bold">
                    {data.collection.volume24h} ETH
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Holders</p>
                  <p className="text-2xl font-bold">
                    {data.collection.holders}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Supply</p>
                  <p className="text-2xl font-bold">
                    {data.collection.totalSupply}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Holder Distribution
                  </span>
                  <span className="text-sm font-medium">
                    {((data.collection.uniqueHolders / data.collection.holders) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(data.collection.uniqueHolders / data.collection.holders) * 100}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Prediction</CardTitle>
            <div className="flex gap-2">
              <Badge variant={data.valuePrediction.confidence > 0.7 ? 'success' : 'secondary'}>
                {(data.valuePrediction.confidence * 100).toFixed(0)}% Confidence
              </Badge>
              <Badge variant="outline">
                {data.valuePrediction.timeframe}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Predicted Floor Price</p>
                <p className="text-2xl font-bold">
                  {data.valuePrediction.predictedFloor} ETH
                </p>
              </div>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {data.valuePrediction.factors.map((factor, index) => (
                    <p key={index} className="text-sm">• {factor}</p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <div className="flex gap-2">
            <Badge variant={data.marketTrends.trendDirection === 'up' ? 'success' : 'danger'}>
              {data.marketTrends.trendDirection === 'up' ? 'Uptrend' : 'Downtrend'}
            </Badge>
            <Badge variant={data.marketTrends.sentiment.score > 0.5 ? 'success' : 'danger'}>
              Sentiment: {(data.marketTrends.sentiment.score * 100).toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.marketTrends.priceHistory}>
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

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    rec.type === 'buy' ? 'success' :
                    rec.type === 'sell' ? 'danger' : 'secondary'
                  }>
                    {rec.type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {(rec.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                </div>
                <p className="text-sm">{rec.reason}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 