import { usePortfolio } from '@/hooks/use-portfolio';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icons } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';

const DEFAULT_TIMEFRAME = "1w";
const DEFAULT_NETWORK = "ethereum";

export function PortfolioOverview() {
  const { summary, tokens, isLoading, error } = usePortfolio({ timeframe: DEFAULT_TIMEFRAME, network: DEFAULT_NETWORK });

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <Icons.portfolio className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Error loading portfolio data</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <Icons.portfolio className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="mt-4 h-4 w-[60px]" />
        </CardContent>
      </Card>
    );
  }

  const percentageChange = summary?.percentChange24h || 0;
  const isPositive = percentageChange >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
        <Icons.portfolio className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(summary?.totalValue || 0)}
        </div>
        <div className="mt-1 flex items-center space-x-2">
          <span
            className={
              isPositive ? 'text-green-500' : 'text-red-500'
            }
          >
            {isPositive ? (
              <Icons.trendingUp className="h-4 w-4" />
            ) : (
              <Icons.trendingDown className="h-4 w-4" />
            )}
          </span>
          <p
            className={`text-xs ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}
            {percentageChange.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground">vs yesterday</p>
        </div>
      </CardContent>
    </Card>
  );
} 