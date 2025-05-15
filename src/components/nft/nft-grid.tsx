import React from 'react';
import { NFT } from '@/lib/types/nft-types';
import { NFTCard } from './nft-card';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming a Skeleton component for loading
import { cn } from '@/lib/utils';

interface NFTGridProps {
  nfts?: NFT[];
  isLoading?: boolean;
  error?: Error | null;
  onViewNftDetails?: (nft: NFT) => void;
  className?: string;
  gridClassName?: string; // For styling the grid itself
  emptyStateMessage?: string;
  skeletonCount?: number; // Number of skeletons to show while loading
}

export const NFTGrid: React.FC<NFTGridProps> = ({
  nfts,
  isLoading = false,
  error = null,
  onViewNftDetails,
  className,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6',
  emptyStateMessage = 'No NFTs found.',
  skeletonCount = 10, // Default to 10 skeletons for a decent loading view
}) => {
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-destructive p-8 data-card', className)}>
        <p className='text-lg font-semibold mb-2'>Error loading NFTs</p>
        <p className='text-sm'>{error.message || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(gridClassName, className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className='data-card rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col'>
            <Skeleton className='aspect-square w-full' />
            <div className='p-4 space-y-2'>
              <Skeleton className='h-5 w-3/4' />
              <Skeleton className='h-8 w-1/2' />
              <Skeleton className='h-10 w-full mt-2' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-muted-foreground p-8 data-card', className)}>
        <p className='text-lg'>{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(gridClassName, className)}>
      {nfts.map((nft) => (
        <NFTCard 
          key={`${nft.contractAddress}-${nft.tokenId}`} 
          nft={nft} 
          onViewDetails={onViewNftDetails} 
        />
      ))}
    </div>
  );
}; 