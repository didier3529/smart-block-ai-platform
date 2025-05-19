'use client';

import { useEffect, useState } from 'react';
import { NFTItem, NFTAttribute } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import { shortenAddress } from '@/lib/utils/address-utils';
import { formatDate } from '@/lib/utils/format-utils';
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/ui/icons";
import { ExternalLinkIcon } from "lucide-react";

interface NFTItemViewProps {
  collectionAddress: string;
  tokenId: string;
}

export default function NFTItemView({ collectionAddress, tokenId }: NFTItemViewProps) {
  const [nft, setNft] = useState<NFTItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        const nftData = await nftService.getNFTItem(collectionAddress, tokenId);
        
        if (nftData) {
          setNft(nftData);
          setError(null);
        } else {
          setError('NFT not found');
        }
      } catch (err) {
        console.error('Error fetching NFT data:', err);
        setError('Failed to load NFT data');
      } finally {
        setLoading(false);
      }
    };

    if (collectionAddress && tokenId) {
      fetchNFTData();
    }
  }, [collectionAddress, tokenId]);

  return (
    <div className="container mx-auto px-4 py-8">
      {error ? (
        <div className="my-4 p-4 bg-red-500 text-white rounded">
          {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div>
            <Skeleton className="h-8 w-4/5 mb-2" />
            <Skeleton className="h-6 w-3/5 mb-1" />
            <Skeleton className="h-4 w-2/5 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <div className="flex space-x-2 mb-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5 mt-1" />
          </div>
        </div>
      ) : nft ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* NFT Image */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square w-full">
              <Image
                src={nftService.getNFTImageUrl(nft) || '/images/nft-placeholder.png'}
                alt={nft.normalized_metadata?.name || `NFT #${nft.token_id}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </Card>

          {/* NFT Details */}
          <div>
            {/* Collection link */}
            <Link href={`/nft/collection/${nft.token_address}`} className="text-primary hover:underline">
              {nft.name || 'Collection'}
            </Link>
            
            {/* NFT Name */}
            <h1 className="text-2xl font-bold mt-1 mb-1">
              {nft.normalized_metadata?.name || `#${nft.token_id}`}
            </h1>
            
            {/* Token ID & Contract */}
            <p className="text-sm text-muted-foreground">
              Token ID: {nft.token_id}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Contract: {shortenAddress(nft.token_address || '')}
            </p>
            
            {/* Description */}
            {nft.normalized_metadata?.description && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <p>
                    {nft.normalized_metadata.description}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Owner */}
            {nft.owner_of && (
              <div className="mb-6">
                <h3 className="text-sm text-muted-foreground">
                  Owner
                </h3>
                <p>
                  {shortenAddress(nft.owner_of)}
                </p>
              </div>
            )}
            
            {/* External Links */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  asChild
                >
                  <a 
                    href={`https://opensea.io/assets/ethereum/${nft.token_address}/${nft.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    View on OpenSea
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  asChild
                >
                  <a 
                    href={`https://etherscan.io/token/${nft.token_address}?a=${nft.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    View on Etherscan
                  </a>
                </Button>
              </div>
            </div>
            
            {/* Attributes/Traits */}
            {nft.normalized_metadata?.attributes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Attributes
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(nft.normalized_metadata.attributes as NFTAttribute[]).map((attr, index) => (
                    <Card 
                      key={index}
                      className="text-center p-3"
                    >
                      <p className="text-xs text-muted-foreground truncate">
                        {attr.trait_type}
                      </p>
                      <p className="font-semibold truncate">
                        {attr.value}
                      </p>
                      {attr.trait_count && (
                        <p className="text-xs text-muted-foreground">
                          {((attr.trait_count / (nft.normalized_metadata?.attributes?.length || 1)) * 100).toFixed(1)}% have this trait
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Token Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Contract Type</span>
                  <span>{nft.contract_type || 'ERC721'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Token Standard</span>
                  <span>{nft.contract_type || 'ERC721'}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Chain</span>
                  <span>Ethereum</span>
                </div>
                <Separator />
                {nft.last_token_uri_sync && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated</span>
                      <span>{formatDate(new Date(nft.last_token_uri_sync))}</span>
                    </div>
                    <Separator />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 