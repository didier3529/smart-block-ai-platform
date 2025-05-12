import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getNFTMarketData } from "@/lib/services/nft-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams || new URL(request.url).searchParams;
    const timeframe = searchParams.get("timeframe") as "1d" | "1w" | "1m" | "1y"
    
    if (!timeframe) {
      return NextResponse.json(
        { error: "Timeframe parameter is required" },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
          }
        }
      )
    }

    const data = await getNFTMarketData(timeframe)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    })
  } catch (error) {
    console.error("NFT Market API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch NFT market data" },
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
    )
  }
} 