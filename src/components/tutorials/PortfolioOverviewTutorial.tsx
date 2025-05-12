import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, TrendingUp, PieChart, ArrowRight, BarChart3 } from 'lucide-react';

interface PortfolioOverviewTutorialProps {
  onComplete?: () => void;
}

export function PortfolioOverviewTutorial({ onComplete }: PortfolioOverviewTutorialProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Overview Tutorial
        </CardTitle>
        <CardDescription>
          Learn how to track and analyze your crypto portfolio with Smart Block AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Portfolio Dashboard</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <p className="font-medium">Asset Distribution</p>
                    <p className="text-sm text-muted-foreground">
                      View your portfolio's asset allocation and balance distribution across different cryptocurrencies.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <p className="font-medium">Performance Metrics</p>
                    <p className="text-sm text-muted-foreground">
                      Track key performance indicators, including ROI, profit/loss, and historical value changes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Pro Tip: Use the AI Analysis feature to get personalized insights about your portfolio performance and potential optimizations.
              </AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Portfolio Management</h3>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Adding Assets</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Connect your wallet or enter addresses manually</li>
                    <li>Import transaction history for accurate tracking</li>
                    <li>Set custom labels and tags for better organization</li>
                  </ol>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Tracking Performance</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Monitor real-time value changes</li>
                    <li>View detailed transaction history</li>
                    <li>Analyze performance across different time periods</li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Smart Block AI's AI agents continuously analyze your portfolio to provide:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Risk assessment and diversification recommendations</li>
                  <li>Market trend analysis and potential opportunities</li>
                  <li>Gas optimization suggestions for transactions</li>
                  <li>Custom alerts for significant market movements</li>
                </ul>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="mt-6 flex justify-end">
          <Button onClick={onComplete} className="flex items-center gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 