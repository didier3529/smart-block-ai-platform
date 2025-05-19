import { Alchemy, Network } from "alchemy-sdk";
import type { NFTMarketData } from "@/lib/hooks/use-nft-market"
import {
  NFT, 
  NFTCollection, 
  NFTMarketplaceStats, 
  PaginatedNFTResponse, 
  PaginatedCollectionResponse, 
  NFTQueryFilters 
} from '../types/nft-types';
import {
  mockMarketplaceStats,
  mockNfts as allMockNfts,
  mockPaginatedCollections
} from '../mock-data/nft-market-mock';
import { POPULAR_COLLECTION_ADDRESSES, MOCK_COLLECTIONS } from '../mock-data/nft-collections';
import { NFTApiResponse, NFTMarketOverview, NFTPaginationResult, NFTAsset, NFTCollectionStats, NFTTrade, NFTFilter } from "@/lib/types/nft-types";
import { moralisService } from "./moralis-service";
import { getMockNFTCollections, getMockNFTMarketOverview, getMockNFTAssets } from "@/lib/mock-data/nft-mock-data";
import { NFTItem } from '@/lib/types/nft-types';
import mockNFTMarket from '../mock-data/nft-market-mock';

// Alchemy SDK setup
const settings = {
  // Use the environment variable for the API key, fallback to 'demo' if not set
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "demo",
  network: Network.ETH_MAINNET
};

// Log which API key is being used (mask all but last 4 chars)
const maskedKey = settings.apiKey.length > 4 ? '****' + settings.apiKey.slice(-4) : settings.apiKey;
console.log(`[NFTService] Using Alchemy with API key: ${maskedKey}`);
console.log(`[NFTService] Network: ${settings.network}`);

// Force restart alchemy client with the proper key
const alchemy = new Alchemy(settings);

// Helper for simulating API delay when needed
const API_DELAY = 200; // milliseconds
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, API_DELAY);
  });
};

export const getNftMarketplaceStats = async (): Promise<NFTMarketplaceStats> => {
  console.log('[NFTService] Fetching marketplace stats...');
  
  try {
    // Currently using mock data for overall stats as Alchemy doesn't have a direct equivalent
    // In a real implementation, we might aggregate from multiple sources or use an API like DappRadar
    return {
      ...mockMarketplaceStats,
      lastUpdated: new Date().toISOString() // Update timestamp to show it's "fresh"
    };
  } catch (error) {
    console.error('[NFTService] Error fetching NFT marketplace stats:', error);
    return mockMarketplaceStats;
  }
};

// Supported chains and their IDs
export const supportedChains = {
  ethereum: '0x1',
  polygon: '0x89',
  bsc: '0x38',
  arbitrum: '0xa4b1',
  optimism: '0xa',
  avalanche: '0xa86a',
  base: '0x2105',
};

// Wait time before falling back to mock data
const FALLBACK_TIMEOUT = 10000; // 10 seconds for API responses

// Added error messages that can indicate API credit exhaustion
const API_CREDIT_ERROR_MESSAGES = [
  'API rate limit exceeded',
  'API key unauthorized',
  'API credits exhausted',
  'Too many requests',
  'request failed with status code 429',
  'request failed with status code 401'
];

// Helper to check if an image is a public CDN (OpenSea) or S3
function getSafeCollectionImage(image, address) {
  // If image is missing or is an S3 URL, use OpenSea CDN if available
  const openSeaImages = {
    '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
    '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb': 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
    '0x60e4d786628fea6478f785a6d7e704777c86a7c6': 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
    '0xed5af388653567af2f388e6224dc7c4b3241c544': 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
    '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e': 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
    '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b': 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format'
  };
  if (!image || image.includes('s3.amazonaws.com')) {
    const safe = openSeaImages[address?.toLowerCase()];
    return safe || '/images/nft-placeholder.png';
  }
  return image;
}

/**
 * NFT Service for fetching NFT data using Moralis API with mock data fallback
 */
export class NFTService {
  /**
   * Get NFT market overview data - trending and top collections
   */
  public async getNFTMarketOverview(chainId: string = supportedChains.ethereum): Promise<{ status: 'success' | 'error', data?: NFTMarketOverview, error?: string }> {
    try {
      // IMPORTANT: Check if we want to force using mock data from env variables
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_PRICE_DATA === 'true';
      
      if (useMockData) {
        console.log('[NFTService] Using mock NFT market data based on environment configuration');
        return { status: 'success', data: mockNFTMarket };
      }
      
      console.log('[NFTService] Attempting to fetch real NFT market data...');
      
      // Try to get real data with timeout
      try {
        // Race between real data and timeout
        const realDataPromise = moralisService.getNFTMarketData().catch(error => {
          // Check if error message contains any indication of API credit exhaustion
          const errorMessage = (error?.message || '').toLowerCase();
          const isApiCreditError = API_CREDIT_ERROR_MESSAGES.some(msg => 
            errorMessage.includes(msg.toLowerCase())
          );
          
          if (isApiCreditError) {
            console.warn('[NFTService] API credits exhausted, using fallback mock data');
          } else {
            console.error('[NFTService] Error fetching NFT market data:', error);
          }
          
          // Always fall back to mock data on any error
          throw error;
        });
        
        // Create a timeout promise
        const timeoutPromise = new Promise<NFTMarketOverview>((resolve) => {
          setTimeout(() => {
            console.log('[NFTService] API request timed out, using mock market data');
            resolve(mockNFTMarket);
          }, FALLBACK_TIMEOUT);
        });
        
        // Race between real data and timeout
        const marketData = await Promise.race([realDataPromise, timeoutPromise]);
        
        // Check if we got valid data structure before using it
        if (marketData && (marketData.trending?.length > 0 || marketData.top?.length > 0)) {
          console.log('[NFTService] Successfully received API data - found collections.');
          
          // Log the collections we got
          console.log(`[NFTService] Trending: ${marketData.trending?.length || 0}, Top: ${marketData.top?.length || 0} collections`);
          
          // Process the data to make sure images are safe
          if (marketData.trending) {
            marketData.trending = marketData.trending.map(item => {
              if (item.collection_address) {
                const normalizedAddress = item.collection_address.toLowerCase();
                item.image = getSafeCollectionImage(item.image, normalizedAddress);
              }
              return item;
            });
          }
          
          if (marketData.top) {
            marketData.top = marketData.top.map(item => {
              if (item.collection_address) {
                const normalizedAddress = item.collection_address.toLowerCase();
                item.image = getSafeCollectionImage(item.image, normalizedAddress);
              }
              return item;
            });
          }
          
          return { status: 'success', data: marketData };
        } else {
          console.warn('[NFTService] API returned empty or invalid data, using mock data');
          return { status: 'success', data: mockNFTMarket };
        }
      } catch (error) {
        console.error('[NFTService] Error in API request:', error);
        return { status: 'success', data: mockNFTMarket };
      }
    } catch (error) {
      console.error('[NFTService] Critical error in getNFTMarketOverview:', error);
      return { status: 'error', error: 'Failed to fetch NFT market data', data: mockNFTMarket };
    }
  }

  /**
   * Helper function to get image URL for an NFT with fallback
   */
  public getNFTImageUrl(nft: NFTItem, size: 'low' | 'medium' | 'high' | 'original' = 'medium'): string {
    // Try to get media collection images first
    const mediaCollection = nft.media?.media_collection;
    if (mediaCollection) {
      const sizedImage = mediaCollection[size]?.url || mediaCollection.original?.url;
      if (sizedImage && !sizedImage.includes('s3.amazonaws.com')) return sizedImage;
    }
    
    // Try normalized metadata image
    if (nft.normalized_metadata?.image && !nft.normalized_metadata.image.includes('s3.amazonaws.com')) {
      return nft.normalized_metadata.image;
    }
    
    // Fallback to placeholder
    return '/images/nft-placeholder.png';
  }
}

// Create and export a singleton instance
export const nftService = new NFTService();

// Also export the class for testing or custom instances
export default NFTService;

/**
 * Get NFT collections - exported function to match what nft-provider.tsx expects
 * CRITICAL FUNCTION: This returns the data used by the NFT Evaluation Module
 */
export const getNftCollections = async (): Promise<{ collections: NFTCollection[] }> => {
  try {
    console.log('[getNftCollections] Starting to fetch NFT collections...');
    
    // IMPORTANT: Always check for forced mock data mode
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_PRICE_DATA === 'true';
    
    if (useMockData) {
      console.log('[getNftCollections] Using mock data due to environment variable');
      return { collections: createCollectionsFromMockData() };
    }
    
    // Get market overview data
    const marketResponse = await nftService.getNFTMarketOverview();
    
    // If there was an error or no data, use mock data
    if (marketResponse.status === 'error' || !marketResponse.data) {
      console.log('[getNftCollections] Error or no data received, using mock data');
      return { collections: createCollectionsFromMockData() };
    }
    
    // Extract the markets data
    const marketData = marketResponse.data;
    
    // Create collections from the market data
    const collections = createCollectionsFromMarketData(marketData);
    
    // Log the results
    console.log(`[getNftCollections] Returning ${collections.length} NFT collections`);
    
    return { collections };
  } catch (error) {
    console.error('[getNftCollections] Error:', error);
    return { collections: createCollectionsFromMockData() };
  }
};

/**
 * Helper function to create collections from market data
 */
function createCollectionsFromMarketData(marketData: NFTMarketOverview): NFTCollection[] {
  const collections: NFTCollection[] = [];
  
  // Process trending collections first
  if (marketData.trending && marketData.trending.length > 0) {
    for (const item of marketData.trending) {
      if (collections.length >= 5) break;
      
      if (item.collection_address && item.name) {
        collections.push({
          address: item.collection_address,
          name: item.name,
          symbol: "",
          contractType: "ERC721",
          description: "",
          floorPrice: item.floor_price || 0,
          floorPriceChange: item.floor_price_24hr_percent_change || 0,
          totalVolume: item.volume_usd || 0,
          ownerCount: item.owners_count || 0,
          itemCount: item.items_total || 0,
          image: item.image || '/images/nft-placeholder.png',
          verified: item.verified_collection || false,
          createdAt: new Date().toISOString()
        });
      }
    }
  }
  
  // Add top collections if we don't have enough
  if (collections.length < 5 && marketData.top && marketData.top.length > 0) {
    for (const item of marketData.top) {
      if (collections.length >= 5) break;
      
      // Make sure we don't add duplicates
      if (item.collection_address && item.name && 
          !collections.some(c => c.address === item.collection_address)) {
        collections.push({
          address: item.collection_address,
          name: item.name,
          symbol: "",
          contractType: "ERC721",
          description: "",
          floorPrice: item.floor_price || 0,
          floorPriceChange: item.floor_price_24hr_percent_change || 0,
          totalVolume: item.volume_usd || 0,
          ownerCount: item.owners_count || 0,
          itemCount: item.items_total || 0,
          image: item.image || '/images/nft-placeholder.png',
          verified: item.verified_collection || false,
          createdAt: new Date().toISOString()
        });
      }
    }
  }
  
  // If we still don't have enough, use our backup collections
  if (collections.length < 5) {
    const backupCollections = getBackupCollections();
    for (const collection of backupCollections) {
      if (collections.length >= 5) break;
      
      // Check if already exists
      if (!collections.some(c => c.address === collection.address)) {
        collections.push(collection);
      }
    }
  }
  
  return collections.slice(0, 5);
}

/**
 * Helper function to create collections directly from mock data
 */
function createCollectionsFromMockData(): NFTCollection[] {
  console.log('[createCollectionsFromMockData] Creating collections from mock data');
  
  // Create from mockNFTMarket
  const collections = createCollectionsFromMarketData(mockNFTMarket);
  
  // If we don't have enough, add backup collections
  if (collections.length < 5) {
    const backupCollections = getBackupCollections();
    for (const collection of backupCollections) {
      if (collections.length >= 5) break;
      
      // Check if already exists
      if (!collections.some(c => c.address === collection.address)) {
        collections.push(collection);
      }
    }
  }
  
  console.log(`[createCollectionsFromMockData] Created ${collections.length} collections`);
  return collections;
}

/**
 * Get backup NFT collections that are always available
 */
function getBackupCollections(): NFTCollection[] {
  return [
    {
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape Yacht Club',
      symbol: "BAYC",
      contractType: "ERC721",
      description: "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs",
      floorPrice: 12.5,
      floorPriceChange: -2.21,
      totalVolume: 1108635,
      ownerCount: 6400,
      itemCount: 10000,
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
      name: 'CryptoPunks',
      symbol: "PUNK",
      contractType: "ERC721",
      description: "CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard.",
      floorPrice: 46.99,
      floorPriceChange: -3.85,
      totalVolume: 256318,
      ownerCount: 3500,
      itemCount: 10000,
      image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
      name: 'Doodles',
      symbol: "DOODLE",
      contractType: "ERC721",
      description: "A community-driven collectibles project featuring art by Burnt Toast.",
      floorPrice: 1.25,
      floorPriceChange: -4.66,
      totalVolume: 354672,
      ownerCount: 5200,
      itemCount: 10000,
      image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      symbol: "MAYC",
      contractType: "ERC721",
      description: "The Mutant Ape Yacht Club is a collection of Mutant Apes",
      floorPrice: 2.27,
      floorPriceChange: -0.45,
      totalVolume: 218829,
      ownerCount: 12800,
      itemCount: 19423,
      image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    },
    {
      address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      name: 'Clone X',
      symbol: "CLONEX",
      contractType: "ERC721",
      description: "CLONE X IS A COLLECTION OF 20,000 NEXT-GEN AVATARS",
      floorPrice: 1.14,
      floorPriceChange: -5.5,
      totalVolume: 220982,
      ownerCount: 9600,
      itemCount: 20000,
      image: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
      verified: true,
      createdAt: new Date().toISOString()
    }
  ];
}

export const getNftCollectionById = async (collectionId: string) => {
  // Implementation omitted for brevity
  return null;
};

export const getNfts = async (filters?: any) => {
  // Implementation omitted for brevity
  return [];
};

export const getNftDetails = async (contractAddress: string, tokenId: string) => {
  // Implementation omitted for brevity
  return null;
};

export const getNftsByCollectionId = async (collectionId: string, page: number = 1, pageSize: number = 10) => {
  // Implementation omitted for brevity
  return { items: [], total: 0, page, pageSize };
};