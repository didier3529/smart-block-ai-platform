'use client';

import { useEffect, useState } from 'react';
import { NFTCollection, NFTItem, NFTAttribute } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import { formatCurrency } from '@/lib/utils/format-utils';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/ui/icons";

interface NFTCollectionViewProps {
  collectionAddress: string;
}

export default function NFTCollectionView({ collectionAddress }: NFTCollectionViewProps) {
  const [collection, setCollection] = useState<NFTCollection | null>(null);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        
        // Fetch collection details
        const collectionData = await nftService.getNFTCollectionDetails(collectionAddress);
        
        if (collectionData) {
          setCollection(collectionData);
          
          // Fetch some sample NFTs from this collection 
          // (In a real app, we'd implement pagination)
          const walletNfts = await nftService.getNFTsByWallet('demo', 'eth');
          
          // Filter NFTs by collection if possible
          const collectionNfts = walletNfts.filter(
            nft => nft.token_address?.toLowerCase() === collectionAddress.toLowerCase()
          );
          
          setNfts(collectionNfts.length > 0 ? collectionNfts : walletNfts.slice(0, 8));
          setError(null);
        } else {
          setError('Collection not found');
        }
      } catch (err) {
        console.error('Error fetching NFT collection:', err);
        setError('Failed to load NFT collection data');
      } finally {
        setLoading(false);
      }
    };

    if (collectionAddress) {
      fetchCollectionData();
    }
  }, [collectionAddress]);

  // Format percentage change with color
  const formatPercentageChange = (value: number) => {
    const color = value >= 0 ? 'text-green-500' : 'text-red-500';
    const formattedValue = value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    return <span className={color}>{formattedValue}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error ? (
        <div className="my-4 p-4 bg-red-500 text-white rounded">
          {error}
        </div>
      ) : loading ? (
        <>
          <div className="flex items-center mb-6">
            <Skeleton className="h-16 w-16 rounded-full mr-4" />
            <div>
              <Skeleton className="h-7 w-64 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-48 w-full mb-6" />
        </>
      ) : collection ? (
        <>
          {/* Collection Header */}
          <div className="flex items-center mb-6 flex-wrap sm:flex-nowrap">
            <Avatar className="h-16 w-16 mr-4 border shadow">
              <AvatarImage src={collection.image} alt={collection.name} />
              <AvatarFallback>{collection.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">
                  {collection.name}
                </h1>
                {collection.verified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Icons.verified className="ml-2 h-5 w-5 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verified Collection</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex space-x-4 mt-1">
                <span className="text-sm text-muted-foreground">
                  {collection.itemCount?.toLocaleString() || '0'} items
                </span>
                <span className="text-sm text-muted-foreground">
                  {collection.ownerCount?.toLocaleString() || 'Multiple'} owners
                </span>
              </div>
            </div>
          </div>

          {/* Collection Stats */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">
                    Floor Price
                  </h3>
                  <p className="text-lg font-medium">
                    {formatCurrency(collection.floorPrice || 0, 'ETH')} ETH
                  </p>
                  {formatPercentageChange(collection.floorPriceChange || 0)}
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">
                    Volume
                  </h3>
                  <p className="text-lg font-medium">
                    {formatCurrency(collection.totalVolume || 0, 'USD')}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">
                    Items
                  </h3>
                  <p className="text-lg font-medium">
                    {collection.itemCount?.toLocaleString() || '0'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">
                    Owners
                  </h3>
                  <p className="text-lg font-medium">
                    {collection.ownerCount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Description */}
          {collection.description && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Description
                </h3>
                <p>
                  {collection.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* NFTs in Collection */}
          <h2 className="text-xl font-bold mt-8 mb-4">
            NFTs in this Collection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.map((nft) => (
              <Link 
                href={`/nft/item/${nft.token_address}/${nft.token_id}`}
                key={`${nft.token_address}-${nft.token_id}`}
                className="block"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="relative aspect-square w-full overflow-hidden">
                    <Image
                      src={nftService.getNFTImageUrl(nft) || '/images/nft-placeholder.png'}
                      alt={nft.normalized_metadata?.name || `NFT #${nft.token_id}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">
                      {nft.normalized_metadata?.name || `#${nft.token_id}`}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      Token ID: {nft.token_id?.substring(0, 8)}...
                    </p>
                    
                    {nft.normalized_metadata?.attributes && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(nft.normalized_metadata.attributes as NFTAttribute[]).slice(0, 3).map((attr, index) => (
                          <Badge 
                            key={index}
                            variant="outline"
                            className="truncate max-w-full text-xs"
                          >
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
} 