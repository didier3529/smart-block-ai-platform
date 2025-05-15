/**
 * NFT Types for ChainOracle
 * These types support the Moralis integration for NFT data
 */

// Basic NFT collection type
export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  contractType: string;
  description: string;
  floorPrice: number;
  floorPriceChange: number;
  totalVolume: number;
  ownerCount: number;
  itemCount: number;
  image: string;
  verified: boolean;
  createdAt: string;
  bannerImage?: string;
  website?: string;
  twitter?: string;
  discord?: string;
}

// NFT metadata type
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: NFTAttribute[];
}

// NFT attribute type
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
  trait_count?: number;
  order?: number;
}

// Individual NFT asset
export interface NFTAsset {
  tokenId: string;
  tokenAddress: string;
  chain: string;
  ownerOf?: string;
  blockNumberMinted?: string;
  blockNumber?: string;
  tokenHash?: string;
  amount?: string;
  contractType?: string;
  name?: string;
  symbol?: string;
  tokenUri?: string;
  metadata?: NFTMetadata;
  image?: string;
  imageUrl?: string;
  normalized_metadata?: NFTMetadata;
  lastMetadataSync?: string;
  lastTokenUriSync?: string;
  rarity?: number;
  rarityRank?: number;
}

// NFT collection statistics
export interface NFTCollectionStats {
  floorPrice?: number;
  count?: number;
  volume24h?: number;
  volume7d?: number;
  volumeChange24h?: number;
  averagePrice?: number;
  marketCap?: number;
  items?: number;
  owners?: number;
  ownersByCount?: Record<string, number>;
}

// NFT trade information
export interface NFTTrade {
  transaction_hash: string;
  transaction_index: string;
  token_ids: string[];
  seller_address: string;
  buyer_address: string;
  marketplace_address: string;
  price: string;
  price_token_address?: string;
  block_timestamp: string;
  block_number: string;
  chain: string;
}

// NFT transfer event
export interface NFTTransfer {
  transaction_hash: string;
  transaction_index: string;
  token_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  value?: string;
  amount?: string;
  contract_type?: string;
  block_timestamp: string;
  block_number: string;
  block_hash?: string;
  operator?: string;
  chain: string;
}

// NFT filtering options
export interface NFTFilter {
  collections?: string[];
  priceMin?: number;
  priceMax?: number;
  chains?: string[];
  sortBy?: 'price' | 'date' | 'rarity' | 'name';
  sortDirection?: 'asc' | 'desc';
  traits?: Record<string, string[]>;
}

// NFT market overview data
export interface NFTMarketOverview {
  trending: NFTCollectionSummary[];
  top: NFTCollectionSummary[];
}

// Collection summary for market data
export interface NFTCollectionSummary {
  collection_address: string;
  name: string;
  image: string;
  floor_price?: number;
  floor_price_usd?: number;
  floor_price_24hr_percent_change?: number;
  volume_usd?: number;
  volume_24hr_percent_change?: number;
  average_price_usd?: number;
  items_total?: number;
  verified_collection?: boolean;
}

// Pagination cursor type
export interface NFTPaginationResult<T> {
  result: T[];
  cursor?: string;
  hasMore: boolean;
}

// NFT API response structure
export interface NFTApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  cursor?: string;
  hasMore?: boolean;
}

export interface NFTTrait {
  trait_type: string;
  value: string | number;
  display_type?: string; // e.g., "number", "date", "boost_percentage"
  max_value?: number;
  trait_count?: number;
  order?: number;
}

export interface NFTOwner {
  address: string;
  quantity?: number; // For ERC1155
}

// Represents an individual NFT item
export interface NFT {
  tokenId: string;
  contractAddress: string;
  name?: string; // Often from metadata
  description?: string; // Often from metadata
  imageUrl?: string; // Often from metadata, resolved
  metadataUrl?: string; // URL to the off-chain metadata JSON (often IPFS)
  metadata?: NFTMetadata; // Parsed metadata
  owner?: NFTOwner; // Current owner
  creatorAddress?: string;
  chain: string; // e.g., "ethereum", "polygon"
  tokenStandard: "ERC721" | "ERC1155";
  lastSalePrice?: string; // e.g., "1.5 ETH"
  lastSaleCurrency?: string; // e.g., "ETH"
  listingPrice?: string; // Current listing price
  listingCurrency?: string; // Currency of the listing
  isListed?: boolean;
  rarityScore?: number;
  rarityRank?: number;
}

// Overall statistics for the NFT market or a specific marketplace
export interface NFTMarketplaceStats {
  totalVolume24h?: string;
  totalVolumeCurrency?: string;
  totalSales24h?: number;
  activeCollections?: number;
  uniqueTraders24h?: number;
  averageNftPrice24h?: string;
  trendingCollections?: NFTCollection[]; // Top N trending collections
  lastUpdated?: string; // ISO timestamp of when the stats were last updated
}

// For API responses that might include pagination or other metadata
export interface PaginatedNFTResponse {
  nfts: NFT[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaginatedCollectionResponse {
  collections: NFTCollection[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Represents a filter or query parameter for fetching NFTs or Collections
export interface NFTQueryFilters {
  chain?: string[];
  collectionIds?: string[];
  ownerAddress?: string;
  isListed?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "floorPrice_asc" | "floorPrice_desc" | "volume24h_desc" | "createdAt_desc";
  searchQuery?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  page?: number;
  pageSize?: number;
}

// Individual NFT item
export interface NFTItem {
  token_address: string;
  token_id: string;
  token_uri?: string;
  contract_type: string;
  token_hash?: string;
  name?: string;
  symbol?: string;
  owner_of?: string;
  amount?: string;
  normalized_metadata?: NFTMetadata;
  last_token_uri_sync?: string;
  last_metadata_sync?: string;
  verified_collection?: boolean;
  possible_spam?: boolean;
  updated_at?: string;
  minter_address?: string;
  
  // Normalized media items
  media?: {
    mimetype?: string;
    parent_hash?: string;
    status?: string;
    updatedAt?: string;
    media_collection?: {
      high?: { url?: string; };
      low?: { url?: string; };
      medium?: { url?: string; };
      original?: { url?: string; };
    };
  };

  // Price data (only for ETH chain)
  price?: number;
  last_sale?: {
    block_number: string;
    block_timestamp: string;
    transaction_hash: string;
    transaction_index: string;
    token_ids: string[];
    seller_address: string;
    buyer_address: string;
    marketplace_address: string;
    price: string;
    price_formatted?: string; // Price in ETH formatted
    usd_price_at_sale?: string; // USD price at time of sale
  };
  priceHistory?: Array<{
    price: number;
    date: string;
    marketplace?: string;
  }>;
  
  // Transfer event
  transfer_event?: {
    block_number: string;
    block_timestamp: string;
    transaction_hash: string;
    transaction_index: string;
    log_index: string;
    value: string;
    value_decimals?: string;
    contract_type: string;
    from_address: string;
    to_address: string;
    operator?: string;
    type?: 'Purchased' | 'Minted' | 'Received' | 'Airdropped';
  };
} 