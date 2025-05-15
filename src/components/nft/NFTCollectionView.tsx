'use client';

import { useEffect, useState } from 'react';
import { 
  Container, Grid, Typography, Box, Card, CardMedia, CardContent, 
  Skeleton, Paper, Divider, Chip, Stack, Avatar, Button
} from '@mui/material';
import { NFTCollection, NFTItem } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import VerifiedIcon from '@mui/icons-material/Verified';
import { formatCurrency } from '@/lib/utils/format-utils';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';

interface NFTCollectionViewProps {
  collectionAddress: string;
}

export default function NFTCollectionView({ collectionAddress }: NFTCollectionViewProps) {
  const [collection, setCollection] = useState<NFTCollection | null>(null);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

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
    const color = value >= 0 ? 'success.main' : 'error.main';
    const formattedValue = value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    return <Typography variant="body2" component="span" color={color}>{formattedValue}</Typography>;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {error ? (
        <Box sx={{ my: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          {error}
        </Box>
      ) : loading ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Skeleton variant="circular" width={80} height={80} sx={{ mr: 2 }} />
            <Box>
              <Skeleton width={300} height={40} />
              <Skeleton width={200} height={24} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={200} sx={{ mb: 4 }} />
        </>
      ) : collection ? (
        <>
          {/* Collection Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <Avatar
              src={collection.image}
              alt={collection.name}
              sx={{ 
                width: { xs: 64, sm: 80 }, 
                height: { xs: 64, sm: 80 },
                mr: 2,
                boxShadow: theme.shadows[2]
              }}
            />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  {collection.name}
                </Typography>
                {collection.verified && (
                  <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                )}
              </Box>
              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="body1" color="text.secondary">
                  {collection.itemCount?.toLocaleString() || '0'} items
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {collection.ownerCount?.toLocaleString() || 'Multiple'} owners
                </Typography>
              </Stack>
            </Box>
          </Box>

          {/* Collection Stats */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Floor Price
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(collection.floorPrice || 0, 'ETH')} ETH
                </Typography>
                {formatPercentageChange(collection.floorPriceChange || 0)}
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Volume
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(collection.totalVolume || 0, 'USD')}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Items
                </Typography>
                <Typography variant="h6">
                  {collection.itemCount?.toLocaleString() || '0'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Owners
                </Typography>
                <Typography variant="h6">
                  {collection.ownerCount?.toLocaleString() || '0'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Collection Description */}
          {collection.description && (
            <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {collection.description}
              </Typography>
            </Paper>
          )}

          {/* NFTs in Collection */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
            NFTs in this Collection
          </Typography>

          <Grid container spacing={3}>
            {nfts.map((nft) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`${nft.token_address}-${nft.token_id}`}>
                <Link 
                  href={`/nft/item/${nft.token_address}/${nft.token_id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height={250}
                      image={nftService.getNFTImageUrl(nft) || '/images/nft-placeholder.png'}
                      alt={nft.normalized_metadata?.name || `NFT #${nft.token_id}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="h6" component="h3" noWrap>
                        {nft.normalized_metadata?.name || `#${nft.token_id}`}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Token ID: {nft.token_id?.substring(0, 8)}...
                      </Typography>
                      
                      {nft.normalized_metadata?.attributes && (
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {(nft.normalized_metadata.attributes as any[]).slice(0, 3).map((attr, index) => (
                              <Chip 
                                key={index}
                                label={`${attr.trait_type}: ${attr.value}`} 
                                size="small"
                                variant="outlined"
                                sx={{ maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal' } }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        </>
      ) : null}
    </Container>
  );
} 