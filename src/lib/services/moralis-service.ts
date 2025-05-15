import axios from 'axios';
import { NFTCollection, NFTItem } from '@/lib/types/nft-types';

// Configuration constants
const MORALIS_API_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// In-memory cache structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

class MoralisService {
  private apiKey: string | null = null;
  private cache: Map<string, CacheItem<any>> = new Map();
  private axiosInstance: ReturnType<typeof axios.create>;

  constructor() {
    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: MORALIS_API_BASE_URL,
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000 // 10 seconds timeout
    });

    // Initialize API key if available in environment
    this.apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY || null;

    // Add request interceptor for API key
    this.axiosInstance.interceptors.request.use((config) => {
      // Set API key header if available
      if (this.apiKey) {
        config.headers['X-API-Key'] = this.apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Implement retry logic for failed requests
        const config = error.config;
        
        // Initialize retry count if not exists
        config.retryCount = config.retryCount || 0;
        
        // Check if we should retry (server errors or network errors)
        const shouldRetry = 
          config.retryCount < MAX_RETRIES && 
          (axios.isAxiosError(error) && 
            (error.response?.status >= 500 || !error.response));
        
        if (shouldRetry) {
          config.retryCount += 1;
          
          // Exponential backoff with jitter
          const delay = RETRY_DELAY * Math.pow(2, config.retryCount - 1) * (0.9 + Math.random() * 0.2);
          
          // Wait for the delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the request
          return this.axiosInstance(config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Set API key - useful for client-side when API key comes from somewhere else
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // Check if there's a valid cache entry
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      console.debug(`[Moralis] Cache hit: ${key}`);
      return cached.data;
    }

    if (cached) {
      console.debug(`[Moralis] Cache expired: ${key}`);
      this.cache.delete(key); // Clean up expired cache
    }
    
    return null;
  }

  // Save data to cache
  private saveToCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
    console.debug(`[Moralis] Cache set: ${key}`);
  }

  // Clear specific cache entry or entire cache
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.debug(`[Moralis] Cache cleared: ${key}`);
    } else {
      this.cache.clear();
      console.debug('[Moralis] All cache cleared');
    }
  }

  // Generic request method with caching and error handling
  private async request<T>(endpoint: string, params: Record<string, any> = {}, skipCache = false): Promise<T> {
    // Create cache key from endpoint and params
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Check cache first if not skipping
    if (!skipCache) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) return cachedData;
    }

    try {
      console.debug(`[Moralis] API request: ${endpoint}`);
      
      // Make the request
      const response = await this.axiosInstance.get<T>(endpoint, { params });
      const data = response.data;
      
      // Cache successful response
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[Moralis] API error: ${endpoint}`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        
        // For 401 or 403, the API key might be invalid
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('[Moralis] API key may be invalid or missing');
        }
      } else {
        console.error(`[Moralis] Unexpected error: ${endpoint}`, error);
      }
      
      throw error;
    }
  }

  // Get NFT collections data (trending, top collections)
  public async getNFTMarketData(): Promise<any> {
    try {
      // Get trending collections
      const trending = await this.request<any[]>(
        '/market-data/nfts/hottest-collections'
      );

      // Get top collections
      const top = await this.request<any[]>(
        '/market-data/nfts/top-collections'
      );

      return {
        trending: trending || [],
        top: top || []
      };
    } catch (error) {
      console.error('[Moralis] Error fetching NFT market data:', error);
      // Return empty data on error as fallback
      return {
        trending: [],
        top: []
      };
    }
  }

  // Get NFTs for a specific wallet address
  public async getNFTsByWallet(walletAddress: string, chain: string = 'eth', limit: number = 20): Promise<NFTItem[]> {
    try {
      // Normalize address
      const normalizedAddress = walletAddress.toLowerCase();
      
      const options: Record<string, any> = {
        chain,
        exclude_spam: true,
        normalizeMetadata: true,
        media_items: true,
        limit
      };

      // Add prices for Ethereum chain
      if (chain === 'eth') {
        options.include_prices = true;
      }
      
      const response = await this.request<{result: NFTItem[], cursor: string}>(
        `/${normalizedAddress}/nft`,
        options
      );
      
      return response?.result || [];
    } catch (error) {
      console.error('[Moralis] Error fetching NFTs by wallet:', error);
      return [];
    }
  }

  // Get details for a specific NFT collection
  public async getNFTCollectionDetails(collectionAddress: string, chain: string = 'eth'): Promise<NFTCollection | null> {
    try {
      // Get collection metadata
      const metadata = await this.request<any>(
        `/nft/${collectionAddress}/metadata`,
        { chain }
      );
      
      // Get collection stats
      const stats = await this.request<any>(
        `/nft/${collectionAddress}/stats`,
        { chain }
      );
      
      // Get collection floor price
      const floorPrice = await this.request<any>(
        `/nft/${collectionAddress}/price`,
        { chain, days: 90 }
      ).catch(() => null); // Ignore errors for floor price
      
      // Combine the data
      return {
        address: collectionAddress,
        name: metadata?.name || 'Unknown Collection',
        symbol: metadata?.symbol || '',
        contractType: metadata?.contract_type || '',
        description: metadata?.description || '',
        floorPrice: floorPrice?.price || 0,
        floorPriceChange: floorPrice?.floor_price_24hr_percent_change || 0,
        totalVolume: stats?.total_volume || 0,
        ownerCount: stats?.owner_count || 0,
        itemCount: stats?.item_count || 0,
        image: metadata?.image || '',
        verified: metadata?.verified_collection || false,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Moralis] Error fetching NFT collection details:', error);
      return null;
    }
  }
  
  // Get specific NFT item by contract address and token ID
  public async getNFTItem(contractAddress: string, tokenId: string, chain: string = 'eth'): Promise<NFTItem | null> {
    try {
      // Get NFT metadata
      const nftData = await this.request<NFTItem>(
        `/nft/${contractAddress}/${tokenId}`,
        { 
          chain,
          normalizeMetadata: true,
          media_items: true
        }
      );
      
      // Get price history if available (only for ETH chain)
      let priceData = null;
      if (chain === 'eth') {
        priceData = await this.request<any>(
          `/nft/${contractAddress}/${tokenId}/price`,
          { chain, days: 90 }
        ).catch(() => null); // Ignore errors for price data
      }
      
      // If we have price data, enhance the NFT object
      if (priceData) {
        return {
          ...nftData,
          price: priceData.price || 0,
          priceHistory: priceData.price_history || []
        };
      }
      
      return nftData;
    } catch (error) {
      console.error('[Moralis] Error fetching NFT item:', error);
      return null;
    }
  }

  // Get NFT transfers for a specific token
  public async getNFTTransfers(contractAddress: string, tokenId: string, chain: string = 'eth', limit: number = 10): Promise<any[]> {
    try {
      const response = await this.request<{result: any[]}>(
        `/nft/${contractAddress}/${tokenId}/transfers`,
        { chain, limit }
      );
      
      return response?.result || [];
    } catch (error) {
      console.error('[Moralis] Error fetching NFT transfers:', error);
      return [];
    }
  }
  
  // Health check method
  public async checkHealth(): Promise<boolean> {
    try {
      // Simple ping to API to check if working
      await this.axiosInstance.get('/ping');
      return true;
    } catch (error) {
      console.error('[Moralis] Health check failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const moralisService = new MoralisService();

// Also export the class for testing or custom instances
export default MoralisService; 