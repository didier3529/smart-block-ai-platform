import React from 'react';
import Image from 'next/image';
import { NFT } from '@/lib/types/nft-types';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { Tag } from '@/components/ui/tag'; // Assuming a Tag component for chain/status
import { cn } from '@/lib/utils'; // Assuming a utility for class names

interface NFTCardProps {
  nft: NFT;
  className?: string;
  onViewDetails?: (nft: NFT) => void; // Optional handler for when details are requested
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, className, onViewDetails }) => {
  const displayImage = nft.imageUrl || nft.metadata?.image || 'https://via.placeholder.com/300?text=No+Image';
  const displayName = nft.name || nft.metadata?.name || `Token #${nft.tokenId}`;

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(nft);
    }
    // If no handler, could navigate or do something else by default
    // console.log('View details for:', nft.tokenId);
  };

  return (
    <div
      className={cn(
        'data-card rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-lg',
        'flex flex-col', // Ensure content inside flexes column-wise
        className
      )}
    >
      <div className='relative aspect-square w-full overflow-hidden'>
        <Image 
          src={displayImage} 
          alt={displayName} 
          fill
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          className='object-cover transition-transform duration-300 ease-in-out group-hover:scale-105' 
        />
        {nft.chain && (
          <Tag 
            variant="chain" 
            className='absolute top-2 right-2'
          >
            {nft.chain.toUpperCase()}
          </Tag>
        )}
      </div>

      <div className='p-4 flex flex-col flex-grow'> {/* Added flex-grow here */}
        <h3 className='text-lg font-semibold leading-tight truncate mb-1' title={displayName}>
          {displayName}
        </h3>
        
        {/* Collection Name - Assuming it might come from a parent or be resolved differently */}
        {/* <p className='text-sm text-muted-foreground truncate mb-2'>Collection Name</p> */}

        <div className='mt-auto'> {/* Pushes content below to the bottom */}
          {nft.isListed && nft.listingPrice && nft.listingCurrency && (
            <div className='mb-3'>
              <p className='text-xs text-muted-foreground'>Price</p>
              <p className='text-xl font-bold text-primary'>
                {nft.listingPrice} {nft.listingCurrency}
              </p>
            </div>
          )}
          {!nft.isListed && (
            <div className='mb-3'>
              <p className='text-sm font-semibold text-muted-foreground'>Not Listed</p>
            </div>
          )}

          <Button 
            variant='outline' 
            className='w-full' 
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}; 