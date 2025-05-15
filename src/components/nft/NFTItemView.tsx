'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  Paper,
  Divider,
  Chip,
  Stack,
  Link as MuiLink,
  Button
} from '@mui/material';
import { NFTItem } from '@/lib/types/nft-types';
import { nftService } from '@/lib/services/nft-service';
import { shortenAddress } from '@/lib/utils/address-utils';
import { formatDate } from '@/lib/utils/format-utils';
import LaunchIcon from '@mui/icons-material/Launch';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';

interface NFTItemViewProps {
  collectionAddress: string;
  tokenId: string;
}

export default function NFTItemView({ collectionAddress, tokenId }: NFTItemViewProps) {
  const [nft, setNft] = useState<NFTItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error ? (
        <Box sx={{ my: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          {error}
        </Box>
      ) : loading ? (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} animation="wave" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={40} width="80%" />
            <Skeleton variant="text" height={30} width="60%" />
            <Skeleton variant="text" height={20} width="40%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={100} height={32} />
            </Stack>
            <Skeleton variant="text" height={20} width="90%" />
            <Skeleton variant="text" height={20} width="70%" />
          </Grid>
        </Grid>
      ) : nft ? (
        <Grid container spacing={4}>
          {/* NFT Image */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                maxHeight: '600px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Box component="img"
                src={nftService.getNFTImageUrl(nft) || '/images/nft-placeholder.png'}
                alt={nft.normalized_metadata?.name || `NFT #${nft.token_id}`}
                sx={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxHeight: '600px'
                }}
              />
            </Paper>
          </Grid>

          {/* NFT Details */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Collection link */}
              <Link href={`/nft/collection/${nft.token_address}`} passHref style={{ textDecoration: 'none' }}>
                <Typography 
                  variant="subtitle1" 
                  color="primary" 
                  component="div" 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' } 
                  }}
                >
                  {nft.name || 'Collection'}
                </Typography>
              </Link>
              
              {/* NFT Name */}
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                {nft.normalized_metadata?.name || `#${nft.token_id}`}
              </Typography>
              
              {/* Token ID & Contract */}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Token ID: {nft.token_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Contract: {shortenAddress(nft.token_address || '')}
              </Typography>
              
              {/* Description */}
              {nft.normalized_metadata?.description && (
                <Paper 
                  elevation={1} 
                  sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}
                >
                  <Typography variant="body1">
                    {nft.normalized_metadata.description}
                  </Typography>
                </Paper>
              )}
              
              {/* Owner */}
              {nft.owner_of && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Owner
                  </Typography>
                  <Typography variant="body1">
                    {shortenAddress(nft.owner_of)}
                  </Typography>
                </Box>
              )}
              
              {/* External Links */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="outlined" 
                    startIcon={<LaunchIcon />}
                    component={MuiLink}
                    href={`https://opensea.io/assets/ethereum/${nft.token_address}/${nft.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on OpenSea
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<LaunchIcon />}
                    component={MuiLink}
                    href={`https://etherscan.io/token/${nft.token_address}?a=${nft.token_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </Button>
                </Stack>
              </Box>
              
              {/* Attributes/Traits */}
              {nft.normalized_metadata?.attributes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Attributes
                  </Typography>
                  <Grid container spacing={1}>
                    {(nft.normalized_metadata.attributes as any[]).map((attr, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Paper 
                          elevation={1}
                          sx={{ 
                            p: 1.5, 
                            textAlign: 'center',
                            borderRadius: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {attr.trait_type}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {attr.value}
                          </Typography>
                          {attr.trait_count && (
                            <Typography variant="caption" color="text.secondary">
                              {((attr.trait_count / (nft.normalized_metadata?.attributes?.length || 1)) * 100).toFixed(1)}% have this trait
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {/* Token Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Contract Type</Typography>
                    <Typography variant="body2">{nft.contract_type || 'ERC721'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Token Standard</Typography>
                    <Typography variant="body2">{nft.contract_type || 'ERC721'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Chain</Typography>
                    <Typography variant="body2">Ethereum</Typography>
                  </Box>
                  {nft.last_metadata_sync && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body2">{formatDate(new Date(nft.last_metadata_sync))}</Typography>
                    </Box>
                  )}
                  {nft.token_uri && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Metadata</Typography>
                      <MuiLink 
                        href={nft.token_uri} 
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          maxWidth: '200px', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}
                      >
                        {nft.token_uri.startsWith('ipfs://') ? nft.token_uri : 'View Metadata'}
                      </MuiLink>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>
      ) : null}
    </Container>
  );
} 