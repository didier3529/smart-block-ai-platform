'use client';

import { useEffect, useState } from 'react';
import { 
  Container, Grid, Typography, Box, Card, CardMedia, CardContent, 
  Skeleton, Paper, TextField, Button, InputAdornment, Chip, Stack,
  Alert
} from '@mui/material';
import { NFTItem } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import SearchIcon from '@mui/icons-material/Search';
import { isValidEthAddress } from '@/lib/utils/address-utils';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';
import { useAccount } from '@/lib/hooks/use-account';

export default function NFTWalletView() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const { account, isConnected } = useAccount();
  const theme = useTheme();

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mt: 2, mb: 4 }}>
        NFT Wallet
      </Typography>

      {/* Wallet search form */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8} md={9} lg={10}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter wallet address or use 'demo' for sample data"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                type="submit"
              >
                View NFTs
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2">
          {searchAddress === 'demo' 
            ? 'Sample NFT Collection' 
            : `NFTs for ${searchAddress.substring(0, 6)}...${searchAddress.substring(searchAddress.length - 4)}`}
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Card elevation={2}>
                <Skeleton variant="rectangular" height={260} animation="wave" />
                <CardContent>
                  <Skeleton animation="wave" height={25} width="60%" />
                  <Skeleton animation="wave" height={20} width="40%" />
                  <Skeleton animation="wave" height={20} width="70%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : nfts.length > 0 ? (
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
                    height={260}
                    image={nftService.getNFTImageUrl(nft) || '/images/nft-placeholder.png'}
                    alt={nft.normalized_metadata?.name || `NFT #${nft.token_id}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" noWrap>
                      {nft.normalized_metadata?.name || `#${nft.token_id}`}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {nft.name}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Token ID: {nft.token_id?.length > 8 
                        ? `${nft.token_id.substring(0, 8)}...` 
                        : nft.token_id}
                    </Typography>
                    
                    {nft.normalized_metadata?.attributes && (
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                          {(nft.normalized_metadata.attributes as any[]).slice(0, 2).map((attr, index) => (
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
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No NFTs found for this wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Either the wallet doesn't own any NFTs or there was an error retrieving them.
          </Typography>
        </Box>
      )}
    </Container>
  );
} 