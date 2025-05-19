import React from 'react'
import { Box, Typography, Grid, Card, CardContent, Skeleton, Chip } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { useNFT } from '@/lib/providers/nft-provider'
import { formatCurrency } from '@/lib/utils/format-utils'

export function NFTOverview() {
  const { isLoading, nftData, error } = useNFT()

  // Format percentage change with up/down arrow
  const formatPercentChange = (value: number) => {
    const isPositive = value >= 0
    const Icon = isPositive ? ArrowUpwardIcon : ArrowDownwardIcon
    const color = isPositive ? 'success.main' : 'error.main'
    const formattedValue = isPositive ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color }}>
        <Icon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="body2" component="span" color="inherit">
          {formattedValue}
        </Typography>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((key) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card>
              <CardContent>
                <Skeleton animation="wave" height={20} width="40%" />
                <Skeleton animation="wave" height={40} width="60%" />
                <Skeleton animation="wave" height={20} width="80%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.main' }}>
        <Typography>Failed to load NFT market data: {error.message}</Typography>
      </Box>
    )
  }

  // Use stats from NFT provider context
  const stats = nftData.stats || {
    totalVolume24h: '$158.5M',
    totalSales24h: 12450,
    activeCollections: 286,
    uniqueTraders24h: 8920,
    averageNftPrice24h: '$1.23K'
  }

  // Mock data for percentage changes (not available in the API)
  const changes = {
    volume: 12.8,
    sales: -5.2,
    collections: 3.7,
    traders: 8.9
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              24h Volume
            </Typography>
            <Typography variant="h5" component="div" gutterBottom>
              {stats.totalVolume24h || '$158.5M'}
            </Typography>
            {formatPercentChange(changes.volume)}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              24h Sales
            </Typography>
            <Typography variant="h5" component="div" gutterBottom>
              {stats.totalSales24h?.toLocaleString() || '12,450'}
            </Typography>
            {formatPercentChange(changes.sales)}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Active Collections
            </Typography>
            <Typography variant="h5" component="div" gutterBottom>
              {stats.activeCollections?.toLocaleString() || '286'}
            </Typography>
            {formatPercentChange(changes.collections)}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Unique Traders
            </Typography>
            <Typography variant="h5" component="div" gutterBottom>
              {stats.uniqueTraders24h?.toLocaleString() || '8,920'}
            </Typography>
            {formatPercentChange(changes.traders)}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}