import { useNFTAnalysis } from '@/hooks/use-nft-analysis';
import { formatCurrency } from '@/lib/utils';
import { Icons } from '../ui/icons';
import { Skeleton } from '../ui/skeleton';

export function NFTOverview() {
  const DEFAULT_COLLECTION = 'default'; // TODO: Replace with actual collection address
  const DEFAULT_NETWORK = 'ethereum';
  const { data: nftData, isLoading, error } = useNFTAnalysis(DEFAULT_COLLECTION, DEFAULT_NETWORK);

  if (error) {
    return (
      <div className="data-card">
        <div className="stat-container">
          <div className="flex items-center justify-between">
            <span className="stat-label">NFT Portfolio</span>
            <Icons.nft className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-sm text-destructive">Error loading NFT data</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="data-card">
        <div className="stat-container">
          <div className="flex items-center justify-between">
            <span className="stat-label">NFT Portfolio</span>
            <Icons.nft className="h-4 w-4 text-muted-foreground" />
          </div>
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      </div>
    );
  }

  const totalValue = nftData?.data?.valuation?.currentValue || 0;
  const collectionCount = nftData?.data ? 1 : 0;
  const percentageChange = nftData?.data?.collection?.floorPriceChange24h || 0;
  const isPositive = percentageChange >= 0;

  return (
    <div className="data-card">
      <div className="stat-container">
        <div className="flex items-center justify-between">
          <span className="stat-label">NFT Portfolio</span>
          <Icons.nft className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="stat-value">{formatCurrency(totalValue)}</div>
        <div className="flex items-center gap-2">
          <span className={isPositive ? 'text-success' : 'text-destructive'}>
            {isPositive ? (
              <Icons.trendingUp className="h-4 w-4" />
            ) : (
              <Icons.trendingDown className="h-4 w-4" />
            )}
          </span>
          <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}
            {percentageChange.toFixed(2)}%
          </span>
          <span className="text-sm text-muted-foreground">
            {collectionCount} collections
          </span>
        </div>
      </div>
    </div>
  );
} 