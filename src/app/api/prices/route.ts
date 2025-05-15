import { NextResponse } from 'next/server';
import { PriceFetcher } from '@/lib/services/price-fetcher';
import { DEFAULT_TRADING_PAIRS } from '@/config/api-keys';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const symbols = searchParams.get('symbols')?.split(',') || DEFAULT_TRADING_PAIRS;
    
    const priceFetcher = PriceFetcher.getInstance();
    const prices = await priceFetcher.getPrices(symbols);

    return NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  } catch (error) {
    console.error('Price API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    );
  }
} 