import React, { useEffect, useState } from 'react';
import { ErrorMetrics, ErrorCategory } from '../types/errors';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart } from './ui/charts/LineChart';
import { useErrorStore } from '../stores/error-store';
import { formatDistanceToNow } from 'date-fns';

interface ErrorEntry {
  id: string;
  message: string;
  category: ErrorCategory;
  timestamp: Date;
  resolved: boolean;
}

export const ErrorMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ErrorMetrics>({
    totalErrors: 0,
    errorsByCategory: {},
    errorRate: 0,
    recentErrors: []
  });

  const { errors, resolveError, clearErrors } = useErrorStore();

  useEffect(() => {
    // Update metrics when errors change
    const calculateMetrics = () => {
      const now = Date.now();
      const recentErrors = errors.filter(e => now - e.timestamp.getTime() < 3600000); // Last hour
      
      const errorsByCategory = recentErrors.reduce((acc, error) => {
        acc[error.category] = (acc[error.category] || 0) + 1;
        return acc;
      }, {} as Record<ErrorCategory, number>);

      setMetrics({
        totalErrors: errors.length,
        errorsByCategory,
        errorRate: recentErrors.length / (3600), // Errors per second in last hour
        recentErrors: recentErrors.slice(0, 10) // Last 10 errors
      });
    };

    calculateMetrics();
  }, [errors]);

  const handleResolveError = (errorId: string) => {
    resolveError(errorId);
  };

  const handleClearResolved = () => {
    clearErrors();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Error Monitoring</h2>
        <Button onClick={handleClearResolved}>Clear Resolved</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Error Rate</h3>
          <div className="text-3xl font-bold">
            {metrics.errorRate.toFixed(2)}/s
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Total Errors</h3>
          <div className="text-3xl font-bold">{metrics.totalErrors}</div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Active Issues</h3>
          <div className="text-3xl font-bold">
            {errors.filter(e => !e.resolved).length}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Error Trend</h3>
        <LineChart
          data={metrics.recentErrors.map(error => ({
            timestamp: error.timestamp,
            value: 1
          }))}
          xKey="timestamp"
          yKey="value"
          height={200}
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
        <div className="space-y-4">
          {metrics.recentErrors.map(error => (
            <div
              key={error.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={error.resolved ? 'outline' : 'destructive'}>
                    {error.category}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(error.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1">{error.message}</p>
              </div>
              {!error.resolved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolveError(error.id)}
                >
                  Resolve
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}; 