import { NextResponse } from "next/server"
import { NFTCollection } from "@/types/blockchain"

// Mock data for development - replace with real API calls in production
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get("search")?.toLowerCase() || ""
  const type = searchParams.get("type") || "all"

  // In production, fetch this data from your NFT data provider
  const mockCollections: NFTCollection[] = [
    {
      address: "0x123...abc",
      name: "Bored Ape Yacht Club",
      symbol: "BAYC",
      network: "ethereum",
      floorPrice: 68.5,
      floorPriceChange24h: 2.3,
      volume24h: 1245,
      volumeChange24h: 5.1,
      averagePrice: 70.2,
      marketCap: 685000,
      holders: 6314,
      totalSupply: 10000,
      sales24h: 12,
      verified: true,
      socialMetrics: {
        twitter: "https://twitter.com/boredapeyc",
        discord: "https://discord.gg/bayc",
        website: "https://boredapeyachtclub.com",
        followers: 100000,
        engagement: 5000,
      },
    },
    {
      address: "0x456...def",
      name: "CryptoPunks",
      symbol: "PUNK",
      network: "ethereum",
      floorPrice: 54.2,
      floorPriceChange24h: -1.8,
      volume24h: 987,
      volumeChange24h: -2.4,
      averagePrice: 55.1,
      marketCap: 542000,
      holders: 3562,
      totalSupply: 10000,
      sales24h: 8,
      verified: true,
      socialMetrics: {
        twitter: "https://twitter.com/cryptopunks",
        discord: "https://discord.gg/cryptopunks",
        website: "https://www.larvalabs.com/cryptopunks",
        followers: 80000,
        engagement: 3200,
      },
    },
    {
      address: "0x789...ghi",
      name: "Azuki",
      symbol: "AZUKI",
      network: "ethereum",
      floorPrice: 12.8,
      floorPriceChange24h: 5.6,
      volume24h: 654,
      volumeChange24h: 3.2,
      averagePrice: 13.0,
      marketCap: 128000,
      holders: 5123,
      totalSupply: 10000,
      sales24h: 5,
      verified: false,
      socialMetrics: {
        twitter: "https://twitter.com/azuki",
        discord: "https://discord.gg/azuki",
        website: "https://azuki.com",
        followers: 80000,
        engagement: 3200,
      },
    },
  ]

  // Filter collections based on search query and type
  const filteredCollections = mockCollections.filter((collection) => {
    const matchesSearch = search
      ? collection.name.toLowerCase().includes(search) ||
        collection.symbol.toLowerCase().includes(search)
      : true

    const matchesType = type === "watchlist"
      ? false
      : true

    return matchesSearch && matchesType
  })

  return NextResponse.json(filteredCollections, {
    headers: {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  })
} 