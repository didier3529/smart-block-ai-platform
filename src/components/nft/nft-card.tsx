import { useState } from 'react'
import { Card, CardHeader, CardContent, CardActions, CardMedia, Typography, Button, Chip, Box, Avatar, IconButton } from '@mui/material'
import Link from 'next/link'
import { NFT } from '@/lib/types/nft-types'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ShareIcon from '@mui/icons-material/Share'
import { formatCurrency } from '@/lib/utils/format-utils'
import VerifiedIcon from '@mui/icons-material/Verified'

interface NFTCardProps {
  nft: NFT;
  compact?: boolean;
  showActions?: boolean;
  showPrice?: boolean;
}

export function NFTCard({ nft, compact = false, showActions = true, showPrice = true }: NFTCardProps) {
  const [liked, setLiked] = useState(false)
  
  // Handle null or undefined nft.metadata
  const metadata = nft.metadata || {}
  const name = metadata.name || nft.name || `#${nft.token_id}`
  const image = nft.image_url || metadata.image || '/images/nft-placeholder.png'
  const collectionName = nft.collection?.name || 'Collection'
  
  // Format NFT price if available
  const price = nft.price ? formatCurrency(parseFloat(nft.price.amount), nft.price.currency_symbol) : null
  
  // For compact cards
  if (compact) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height={160}
          image={image}
          alt={name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1, pt: 1, pb: 1, "&:last-child": { pb: 1 } }}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>
          {showPrice && price && (
            <Typography variant="body2" color="text.secondary">
              {price} {nft.price?.currency_symbol}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }
  
  // Standard card with more details
  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6
      }
    }}>
      <CardMedia
        component="img"
        height={260}
        image={image}
        alt={name}
        sx={{ objectFit: 'cover' }}
      />
      
      <CardHeader
        avatar={
          <Avatar 
            aria-label={collectionName}
            src={nft.collection?.image || ''}
            alt={collectionName}
          />
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {name}
            {nft.collection?.verified && (
              <VerifiedIcon color="primary" fontSize="small" sx={{ ml: 0.5 }} />
            )}
          </Box>
        }
        subheader={collectionName}
        sx={{ pb: 0 }}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 1, pb: 1 }}>
        {showPrice && (
          <Box sx={{ mb: 1 }}>
            {price ? (
              <Chip 
                label={`${price} ${nft.price?.currency_symbol}`}
                color="primary"
                size="small"
                sx={{ mr: 1 }}
              />
            ) : (
              <Chip 
                label="Not for sale"
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
          </Box>
        )}
        
        {/* Truncate description to keep cards compact */}
        {metadata.description && (
          <Typography variant="body2" color="text.secondary" sx={{ 
            display: '-webkit-box', 
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: 40
          }}>
            {metadata.description}
          </Typography>
        )}
      </CardContent>
      
      {showActions && (
        <CardActions disableSpacing>
          <IconButton 
            aria-label="add to favorites" 
            onClick={() => setLiked(!liked)}
            color={liked ? 'primary' : 'default'}
          >
            <FavoriteIcon />
          </IconButton>
          <IconButton aria-label="share">
            <ShareIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Link href={`/nft/${nft.token_address}/${nft.token_id}`} passHref>
            <Button size="small" color="primary">
              View
            </Button>
          </Link>
        </CardActions>
      )}
    </Card>
  )
}