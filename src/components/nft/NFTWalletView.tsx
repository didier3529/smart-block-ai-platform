'use client';

import { useEffect, useState } from 'react';
import { NFTItem, NFTAttribute } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import { isValidEthAddress } from '@/lib/utils/address-utils';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from '@/lib/hooks/use-account';
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
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { Search } from "lucide-react";

export default function NFTWalletView() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const { account, isConnected } = useAccount();

  useEffect(() => {
    if (account?.address && isConnected) {
      setSearchAddress(account.address);
      setInputAddress(account.address);
      fetchNFTs(account.address);
    } else {
      // Use demo mode if not connected
      fetchNFTs('demo');
    }
  }, [account, isConnected]);

  const fetchNFTs = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const nftData = await nftService.getNFTsByWallet(address);
      setNfts(nftData);
    } catch (err) {
      console.error('Error fetching wallet NFTs:', err);
      setError('Failed to load NFTs for this wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!isValidEthAddress(inputAddress) && inputAddress !== 'demo') {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setSearchAddress(inputAddress);
    fetchNFTs(inputAddress);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 mt-2">
        NFT Wallet
      </h1>

      {/* Wallet search form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Enter wallet address or use 'demo' for sample data"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
              />
            </div>
            <Button type="submit">
              View NFTs
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {searchAddress === 'demo' 
            ? 'Sample NFT Collection' 
            : `NFTs for ${searchAddress.substring(0, 6)}...${searchAddress.substring(searchAddress.length - 4)}`}
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/5 mb-2" />
                <Skeleton className="h-4 w-2/5 mb-1" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft) => (
            <Link 
              href={`/nft/item/${nft.token_address}/${nft.token_id}`}
              key={`${nft.token_address}-${nft.token_id}`}
              className="block h-full"
            >
              <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className="relative h-64 w-full">
                  <Image
                    src={nftService.getNFTImageUrl(nft) || '/images/nft-placeholder.png'}
                    alt={nft.normalized_metadata?.name || `NFT #${nft.token_id}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium truncate">
                    {nft.normalized_metadata?.name || `#${nft.token_id}`}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {nft.name}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    Token ID: {nft.token_id?.length > 8 
                      ? `${nft.token_id.substring(0, 8)}...` 
                      : nft.token_id}
                  </p>
                  
                  {nft.normalized_metadata?.attributes && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(nft.normalized_metadata.attributes as NFTAttribute[]).slice(0, 2).map((attr, index) => (
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
      ) : (
        <div className="text-center p-12 border rounded-lg">
          <h3 className="text-lg font-medium text-muted-foreground">
            No NFTs found for this wallet
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Either the wallet doesn't own any NFTs or there was an error retrieving them.
          </p>
        </div>
      )}
    </div>
  );
} 