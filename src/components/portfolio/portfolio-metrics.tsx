import { usePortfolio } from '@/hooks/use-portfolio';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icons } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const metrics = [
  {
    label: 'Risk Score',
    key: 'riskScore',
    icon: Icons.alertTriangle,
    description: 'Portfolio risk assessment based on volatility and concentration',
    format: (value: number) => `${value}/100`,
    color: (value: number) =>
      value < 30
        ? 'text-green-500'
        : value < 70
        ? 'text-yellow-500'
        : 'text-red-500',
  },
  {
    label: 'Diversification',
    key: 'diversificationScore',
    icon: Icons.pieChart,
    description: 'Asset distribution across different categories and networks',
    format: (value: number) => `${value}/100`,
    color: (value: number) =>
      value > 70
        ? 'text-green-500'
        : value > 30
        ? 'text-yellow-500'
        : 'text-red-500',
  },
  {
    label: 'Volatility',
    key: 'volatility',
    icon: Icons.activity,
    description: '30-day portfolio volatility',
    format: (value: number) => `${value.toFixed(2)}%`,
    color: (value: number) =>
      value < 30
        ? 'text-green-500'
        : value < 70
        ? 'text-yellow-500'
        : 'text-red-500',
  },
  {
    label: 'Sharpe Ratio',
    key: 'sharpeRatio',
    icon: Icons.trendingUp,
    description: 'Risk-adjusted return metric',
    format: (value: number) => value.toFixed(2),
    color: (value: number) =>
      value > 1
        ? 'text-green-500'
        : value > 0
        ? 'text-yellow-500'
        : 'text-red-500',
  },
] as const;

const DEFAULT_TIMEFRAME = "1w";
const DEFAULT_NETWORK = "ethereum";

export function PortfolioMetrics() {
  const { summary, tokens, isLoading } = usePortfolio({ timeframe: DEFAULT_TIMEFRAME, network: DEFAULT_NETWORK });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Portfolio Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => (
              <Skeleton key={metric.key} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Portfolio Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {metrics.map((metric) => {
            const value = summary?.[metric.key] || 0;
            const Icon = metric.icon;
            return (
              <TooltipProvider key={metric.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {metric.label}
                        </p>
                        <p
                          className={`mt-1 text-xl font-bold ${metric.color(
                            value
                          )}`}
                        >
                          {metric.format(value)}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{metric.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 