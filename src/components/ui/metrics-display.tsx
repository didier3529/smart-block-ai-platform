import React from 'react';
import { MetricsData } from '@/types/common';

interface MetricsDisplayProps {
  metrics: MetricsData[];
  title?: string;
  description?: string;
}

export function MetricsDisplay({ metrics, title, description }: MetricsDisplayProps) {
  return (
    <div className="rounded-lg border p-6">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{metric.value}</p>
              {metric.change !== undefined && (
                <span
                  className={`text-sm font-medium ${
                    metric.trend === 'up'
                      ? 'text-green-500'
                      : metric.trend === 'down'
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                >
                  {metric.change >= 0 ? '+' : ''}
                  {metric.change.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 