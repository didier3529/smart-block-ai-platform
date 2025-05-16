'use client';

import { useEffect, useState } from 'react';
import { NFTMarketOverview } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import { formatCurrency } from '@/lib/utils/format-utils';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/ui/icons";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

/**
 * NFT Marketplace component showing trending and top NFT collections
 */
export default function NFTMarketplace() {
  const [marketData, setMarketData] = useState<NFTMarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const data = await nftService.getNFTMarketOverview();
        setMarketData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching NFT market data:', err);
        setError('Failed to load NFT market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  // Format percentage change with color
  const formatPercentageChange = (value: number) => {
    const color = value >= 0 ? 'text-green-500' : 'text-red-500';
    const formattedValue = value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    return <span className={color}>{formattedValue}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 mt-2">
        NFT Marketplace
      </h1>

      {error && (
        <div className="my-4 p-4 bg-red-500 text-white rounded">
          {error}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">
        Trending Collections
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading 
          ? Array.from(new Array(4)).map((_, index) => (
              <Card key={`skeleton-trending-${index}`} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-2/5 mb-1" />
                  <Skeleton className="h-4 w-3/5" />
                </CardContent>
              </Card>
            ))
          : marketData?.trending?.map((collection) => (
              <Link 
                href={`/nft/collection/${collection.collection_address}`}
                key={collection.collection_address}
                className="block h-full"
              >
                <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="relative h-48 w-full">
                    <Image
                      src={collection.image || '/images/nft-placeholder.png'}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium truncate">
                        {collection.name}
                      </h3>
                      {collection.verified_collection && (
                        <Icons.verified className="h-4 w-4 ml-1 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="bg-primary/10">
                        Floor: {formatCurrency(collection.floor_price || 0, 'ETH')} ETH
                      </Badge>
                      <Badge variant={collection.floor_price_24hr_percent_change >= 0 ? "outline" : "destructive"} className={collection.floor_price_24hr_percent_change >= 0 ? "bg-green-500/10" : ""}>
                        {formatPercentageChange(collection.floor_price_24hr_percent_change || 0)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {collection.items_total?.toLocaleString() || '0'} items
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vol: {formatCurrency(collection.volume_usd || 0, 'USD')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      <h2 className="text-xl font-semibold mb-4 mt-12">
        Top Collections
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading 
          ? Array.from(new Array(4)).map((_, index) => (
              <Card key={`skeleton-top-${index}`} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-2/5 mb-1" />
                  <Skeleton className="h-4 w-3/5" />
                </CardContent>
              </Card>
            ))
          : marketData?.top?.map((collection) => (
              <Link 
                href={`/nft/collection/${collection.collection_address}`}
                key={collection.collection_address}
                className="block h-full"
              >
                <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <div className="relative h-48 w-full">
                    <Image
                      src={collection.image || '/images/nft-placeholder.png'}
                      alt={collection.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium truncate">
                        {collection.name}
                      </h3>
                      {collection.verified_collection && (
                        <Icons.verified className="h-4 w-4 ml-1 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="bg-primary/10">
                        Floor: {formatCurrency(collection.floor_price || 0, 'ETH')} ETH
                      </Badge>
                      <Badge variant={collection.floor_price_24hr_percent_change >= 0 ? "outline" : "destructive"} className={collection.floor_price_24hr_percent_change >= 0 ? "bg-green-500/10" : ""}>
                        {formatPercentageChange(collection.floor_price_24hr_percent_change || 0)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {collection.items_total?.toLocaleString() || '0'} items
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vol: {formatCurrency(collection.volume_usd || 0, 'USD')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>
    </div>
  );
} 