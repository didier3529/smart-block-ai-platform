'use client';

import { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Card, CardMedia, CardContent, Skeleton, Chip, Stack } from '@mui/material';
import { NFTMarketOverview } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import VerifiedIcon from '@mui/icons-material/Verified';
import { formatCurrency } from '@/lib/utils/format-utils';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * NFT Marketplace component showing trending and top NFT collections
 */
export default function NFTMarketplace() {
  const [marketData, setMarketData] = useState<NFTMarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    const color = value >= 0 ? 'success.main' : 'error.main';
    const formattedValue = value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    return <Typography variant="body2" component="span" color={color}>{formattedValue}</Typography>;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mt: 2, mb: 4 }}>
        NFT Marketplace
      </Typography>

      {error && (
        <Box sx={{ my: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          {error}
        </Box>
      )}

      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Trending Collections
      </Typography>

      <Grid container spacing={3}>
        {loading 
          ? Array.from(new Array(4)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-trending-${index}`}>
                <Card elevation={2}>
                  <Skeleton variant="rectangular" height={200} animation="wave" />
                  <CardContent>
                    <Skeleton animation="wave" height={25} width="80%" />
                    <Skeleton animation="wave" height={20} width="40%" />
                    <Skeleton animation="wave" height={20} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : marketData?.trending?.map((collection) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={collection.collection_address}>
                <Link 
                  href={`/nft/collection/${collection.collection_address}`}
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
                      height={200}
                      image={collection.image || '/images/nft-placeholder.png'}
                      alt={collection.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="h3" noWrap>
                          {collection.name}
                        </Typography>
                        {collection.verified_collection && (
                          <VerifiedIcon color="primary" fontSize="small" sx={{ ml: 0.5 }} />
                        )}
                      </Box>
                      
                      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip 
                          label={`Floor: ${formatCurrency(collection.floor_price || 0, 'ETH')} ETH`} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={formatPercentageChange(collection.floor_price_24hr_percent_change || 0)}
                          size="small"
                          variant="outlined"
                          color={collection.floor_price_24hr_percent_change >= 0 ? "success" : "error"}
                        />
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary">
                        {collection.items_total?.toLocaleString() || '0'} items
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vol: {formatCurrency(collection.volume_usd || 0, 'USD')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
      </Grid>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Top Collections
      </Typography>

      <Grid container spacing={3}>
        {loading 
          ? Array.from(new Array(4)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-top-${index}`}>
                <Card elevation={2}>
                  <Skeleton variant="rectangular" height={200} animation="wave" />
                  <CardContent>
                    <Skeleton animation="wave" height={25} width="80%" />
                    <Skeleton animation="wave" height={20} width="40%" />
                    <Skeleton animation="wave" height={20} width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : marketData?.top?.map((collection) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={collection.collection_address}>
                <Link 
                  href={`/nft/collection/${collection.collection_address}`}
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
                      height={200}
                      image={collection.image || '/images/nft-placeholder.png'}
                      alt={collection.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="h3" noWrap>
                          {collection.name}
                        </Typography>
                        {collection.verified_collection && (
                          <VerifiedIcon color="primary" fontSize="small" sx={{ ml: 0.5 }} />
                        )}
                      </Box>
                      
                      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip 
                          label={`Floor: ${formatCurrency(collection.floor_price || 0, 'ETH')} ETH`} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={formatPercentageChange(collection.floor_price_24hr_percent_change || 0)}
                          size="small"
                          variant="outlined"
                          color={collection.floor_price_24hr_percent_change >= 0 ? "success" : "error"}
                        />
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary">
                        {collection.items_total?.toLocaleString() || '0'} items
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vol: {formatCurrency(collection.volume_usd || 0, 'USD')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
      </Grid>
    </Container>
  );
} 