import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getContractAnalysis } from "@/lib/services/contract-service"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl?.searchParams || new URL(request.url).searchParams;
    const type = searchParams.get("type") as "monitored" | "recent"
    
    if (!type) {
      return NextResponse.json(
        { error: "Type parameter is required" },
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

    const data = await getContractAnalysis(type)
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
    console.error("Contract Analysis API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contract analysis" },
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