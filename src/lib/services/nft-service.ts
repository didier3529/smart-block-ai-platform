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
const FALLBACK_TIMEOUT = 15000; // 15 seconds for slower API responses

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
  public async getNFTMarketOverview(): Promise<NFTMarketOverview> {
    try {
      // Check if we want to force using mock data from env variables
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_PRICE_DATA === 'true';
      
      if (useMockData) {
        console.log('[NFTService] Using mock NFT market data based on environment configuration');
        return mockNFTMarket;
      }
      
      // Try to get real data with timeout
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
          console.debug('[NFTService] Timed out, using mock market data');
          resolve(mockNFTMarket);
        }, FALLBACK_TIMEOUT);
      });
      
      // Race between real data and timeout
      const marketData = await Promise.race([realDataPromise, timeoutPromise]);
      
      // Better logging of the actual data we received
      console.log('[NFTService] Received API response:', 
        JSON.stringify(marketData).substring(0, 200) + '...');
      
      // Check if we got valid data structure before using it
      if (marketData && (marketData.trending?.length > 0 || marketData.top?.length > 0)) {
        console.log('[NFTService] Using real API data - found collections.');
        
        // Add collection names if they're missing in the API response
        // Enhanced collection mapping with images and additional details
        const knownCollections = {
          '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': {
            name: 'Bored Ape Yacht Club',
            image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
            description: "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain."
          },
          '0x60e4d786628fea6478f785a6d7e704777c86a7c6': {
            name: 'Mutant Ape Yacht Club',
            image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI?w=500&auto=format',
            description: "The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes that can only be created by exposing an existing Bored Ape to a vial of MUTANT SERUM or by minting a Mutant Ape in the public sale."
          },
          '0xed5af388653567af2f388e6224dc7c4b3241c544': {
            name: 'Azuki',
            image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
            description: "Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden."
          },
          '0xd774557b647330c91bf44cfeab205095f7e6c367': {
            name: 'Nakamigos',
            image: 'https://i.seadn.io/gcs/files/b1c9b831916c8ce4fa1dc6cb702095cd.png?w=500&auto=format',
            description: "Nakamigos is a unique collection of 20,000 NFTs on the Ethereum blockchain."
          },
          '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258': {
            name: 'Otherdeed',
            image: 'https://i.seadn.io/gae/yIm-M5-BpSDdTEIJRt5D6xphizhIdozXjqSITgK4phWq7MmAU3qE7Nw7POGCiPGyhtJ3ZFP8iJ29TFl-RLcGBWX5qI4-ZcnCPcsY4zI?w=500&auto=format',
            description: "Otherdeed is the key to claiming land in Otherside. Each have a unique blend of environment and sediment — some with resources, some home to powerful artifacts."
          },
          '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb': {
            name: 'CryptoPunks',
            image: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?w=500&auto=format',
            description: "CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard."
          },
          '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b': {
            name: 'Clone X',
            image: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
            description: "CLONE X IS A COLLECTION OF 20,000 NEXT-GEN AVATARS, CREATED IN COLLABORATION WITH RTFKT AND TAKASHI MURAKAMI."
          },
          '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e': {
            name: 'Doodles',
            image: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format',
            description: "A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000."
          },
          '0xba30e5f9bb24caa003e9f2f0497ad287fdf95623': {
            name: 'Bored Ape Kennel Club',
            image: 'https://i.seadn.io/gae/l1wZXP2hHFUQ3turU5VQ9PpgVVasyQ79-ChvCgjoU5xKkBA50OGoJqKZeMOR-qLrzqwIfd1HpYmiv23JWm0EZ14owiPYaufqzmj1?w=500&auto=format',
            description: "The Bored Ape Kennel Club is a collection of 10,000 NFTs that extend the Bored Ape Yacht Club ecosystem."
          }
        };
        
        // Add names and images to any trending items where the API didn't provide them
        if (marketData.trending) {
          marketData.trending = marketData.trending.map(item => {
            if (item.collection_address) {
              const normalizedAddress = item.collection_address.toLowerCase();
              const collectionInfo = knownCollections[normalizedAddress];
              if (collectionInfo) {
                if (!item.name) item.name = collectionInfo.name;
                item.image = getSafeCollectionImage(item.image || collectionInfo.image, normalizedAddress);
              } else {
                item.image = getSafeCollectionImage(item.image, normalizedAddress);
              }
            }
            return item;
          });
        }
        // Add names and images to any top items where the API didn't provide them
        if (marketData.top) {
          marketData.top = marketData.top.map(item => {
            if (item.collection_address) {
              const normalizedAddress = item.collection_address.toLowerCase();
              const collectionInfo = knownCollections[normalizedAddress];
              if (collectionInfo) {
                if (!item.name) item.name = collectionInfo.name;
                item.image = getSafeCollectionImage(item.image || collectionInfo.image, normalizedAddress);
              } else {
                item.image = getSafeCollectionImage(item.image, normalizedAddress);
              }
            }
            return item;
          });
        }
        // Transform data if needed to match our interface
        return {
          trending: marketData.trending?.slice(0, 8) || [],
          top: marketData.top?.slice(0, 8) || [],
          walletNFTs: marketData.walletNFTs || mockNFTMarket.walletNFTs // Use mock wallet NFTs if real data doesn't have them
        };
      } else {
        console.warn('[NFTService] API returned empty or invalid data, using mock data');
        // Use mock data if response is empty or invalid
        return mockNFTMarket;
      }
    } catch (error) {
      console.error('[NFTService] Error fetching NFT market data, using mock data', error);
      return mockNFTMarket;
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

export const getNftCollections = async (): Promise<NFTCollection[]> => {
  try {
    console.log('[NFTService] Fetching NFT collections from Moralis API...');
    const marketOverview = await nftService.getNFTMarketOverview();
    console.log(`[NFTService] Received ${marketOverview.trending?.length || 0} trending and ${marketOverview.top?.length || 0} top collections`);
    
    // Create a combined list from trending and top collections
    const collections = [];
    
    // Add trending collections first
    if (marketOverview.trending && marketOverview.trending.length > 0) {
      for (const item of marketOverview.trending) {
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
    
    // Add top collections if needed
    if (collections.length < 5 && marketOverview.top && marketOverview.top.length > 0) {
      for (const item of marketOverview.top) {
        if (collections.length >= 5) break;
        
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
    
    // If we still don't have enough collections, add some major ones
    if (collections.length < 5) {
      const additionalCollections = [
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
        }
      ];
      
      for (const collection of additionalCollections) {
        if (collections.length >= 5) break;
        if (!collections.some(c => c.address === collection.address)) {
          collections.push(collection);
        }
      }
    }
    
    // Limit to 5 collections
    return collections.slice(0, 5);
  } catch (error) {
    console.error('[NFTService] Error in getNftCollections:', error);
    return [];
  }
};

export const getNftCollectionById = async (collectionId: string) => {
  return nftService.getNFTCollectionDetails(collectionId);
};

export const getNfts = async (filters?: any) => {
  return nftService.getNFTCollections(filters?.limit || 20, filters?.cursor);
};

export const getNftDetails = async (contractAddress: string, tokenId: string) => {
  return nftService.getNFTItem(contractAddress, tokenId);
};

export const getNftsByCollectionId = async (collectionId: string, page: number = 1, pageSize: number = 10) => {
  const collection = await nftService.getNFTCollectionDetails(collectionId);
  if (collection && Array.isArray((collection as any).nfts)) {
    const nfts = (collection as any).nfts;
    const start = (page - 1) * pageSize;
    return {
      items: nfts.slice(start, start + pageSize),
      total: nfts.length,
      page,
      pageSize
    };
  }
  return { items: [], total: 0, page, pageSize };
};