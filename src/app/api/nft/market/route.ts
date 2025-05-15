import { NextRequest, NextResponse } from 'next/server';
import { nftService, supportedChains } from '@/lib/services/nft-service';
import { rateLimit } from '@/lib/utils/rate-limit';

// Define rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

/**
 * API route for NFT market data
 * 
 * Supported query parameters:
 * - chainId: The blockchain network ID (default: ethereum)
 * - timeframe: The time period for data (1d, 7d, 30d)
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(10, 'NFT_API'); // 10 requests per minute
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Get URL params
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chainId') || supportedChains.ethereum;
    const timeframe = searchParams.get('timeframe') || '1d';
    
    // Validate chain ID
    const validChainId = Object.values(supportedChains).includes(chainId as string);
    if (!validChainId) {
      return NextResponse.json(
        { error: 'Invalid chain ID' },
        { status: 400 }
      );
    }
    
    // Get market overview data
    const marketResponse = await nftService.getNftMarketOverview(chainId as string);
    
    if (marketResponse.status === 'error' || !marketResponse.data) {
      return NextResponse.json(
        { error: marketResponse.error || 'Failed to fetch NFT market data' },
        { status: 500 }
      );
    }
    
    // Apply timeframe filtering if needed
    let data = marketResponse.data;
    
    // Set cache headers (1 minute for fresh data)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error in NFT market API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 