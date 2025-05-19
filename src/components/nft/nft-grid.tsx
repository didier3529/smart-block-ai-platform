import React from 'react'
import { Grid, Box, CircularProgress, Typography, Skeleton } from '@mui/material'
import { NFTCard } from './nft-card'
import { NFT } from '@/lib/types/nft-types'
import Image from 'next/image'

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  error?: string | null;
}

export function NFTGrid({ 
  nfts, 
  loading = false, 
  emptyMessage = "No NFTs found",
  compact = false,
  error = null
}: NFTGridProps) {
  // Skeleton placeholders during loading
  if (loading) {
    return (
      <Grid container spacing={3}>
        {Array.from(new Array(8)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
            <Box sx={{ width: '100%', height: compact ? 220 : 400 }}>
              <Skeleton variant="rectangular" height={compact ? 160 : 260} animation="wave" />
              <Box sx={{ pt: 1 }}>
                <Skeleton animation="wave" height={28} width="80%" />
                <Skeleton animation="wave" height={18} width="40%" />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    )
  }
  
  // Error message display
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try again later or contact support if the problem persists.
        </Typography>
      </Box>
    )
  }
  
  // Empty state message
  if (!nfts || nfts.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          textAlign: 'center'
        }}
      >
        <Box sx={{ mb: 2, opacity: 0.6 }}>
          <Image 
            src="/images/empty-nft.svg" 
            alt="No NFTs found" 
            width={120} 
            height={120} 
          />
        </Box>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {emptyMessage}
        </Typography>
      </Box>
    )
  }
  
  // Display NFT grid
  return (
    <Grid container spacing={3}>
      {nfts.map((nft) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={`${nft.token_address}-${nft.token_id}`}>
          <NFTCard 
            nft={nft} 
            compact={compact} 
            showActions={!compact}
            showPrice={true}
          />
        </Grid>
      ))}
    </Grid>
  )
}