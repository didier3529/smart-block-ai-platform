import mockNFTMarket from '../mock-data/nft-market-mock';
import { NFTMarketOverview } from '../types/nft-types';

const BASE_API_URL = 'https://deep-index.moralis.io/api/v2.2';

/**
 * Moralis API Service to work with NFT data
 */
class MoralisService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY || '';
    console.log('[MoralisService] Initialized with API key:', this.apiKey ? 'Found key' : 'No key');
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  /**
   * Get NFT Market Data from Moralis API including trending and top collections
   */
  public async getNFTMarketData(): Promise<NFTMarketOverview> {
    try {
      // Check if mock data is forced or no API key is provided
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_PRICE_DATA === 'true';
      if (useMockData || !this.apiKey) {
        console.log('[MoralisService] Using mock NFT market data');
        return mockNFTMarket;
      }

      // Log the request attempt
      console.log('[MoralisService] Fetching NFT market data from Moralis API...');
      
      // Make API request to get the top collections
      const response = await this.fetchWithTimeout(
        `${BASE_API_URL}/market-data/nfts/top-collections`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      // Handle API response
      if (!response.ok) {
        // Get error details
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const errorMessage = errorData.message || response.statusText;
        
        console.error(`[MoralisService] API error: ${status} - ${errorMessage}`, errorData);
        
        // Return mock data on API error
        console.log('[MoralisService] API error occurred, using mock data');
        return mockNFTMarket;
      }

      // Parse successful response
      const data = await response.json();
      console.log('[MoralisService] Successfully fetched NFT market data');
      
      // Return formatted response
      return {
        trending: data.result?.slice(0, 8) || [],
        top: data.result?.slice(8, 16) || [],
        walletNFTs: mockNFTMarket.walletNFTs // Use mock data for wallet NFTs as we don't have real ones
      };
    } catch (error) {
      console.error('[MoralisService] Error fetching NFT market data:', error);
      console.log('[MoralisService] Using mock data as fallback');
      return mockNFTMarket;
    }
  }
}

// Create and export a singleton instance
export const moralisService = new MoralisService();

// Export the class for testing or custom instances
export default MoralisService;