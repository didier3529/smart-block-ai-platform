import { redirect } from 'next/navigation'

export default function NFTMarketplacePage() {
  // Redirect to the dashboard NFT page
  redirect('/dashboard/nfts')
  
  // This is necessary to satisfy TypeScript but will never be executed
  return null
}

// PPR PLAN: The NFT page is a candidate for Partial Pre-Rendering (PPR).
// - Static: Page metadata, headings, collection category filters
// - Dynamic: NFT collection data, trending collections, floor prices
// Next step: Use Next.js 15 PPR API to statically render layout/filters, dynamically render NFT data. 