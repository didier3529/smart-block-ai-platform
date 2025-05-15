import { redirect } from 'next/navigation'

export default function MarketPage() {
  // Redirect to the dashboard Market page
  redirect('/dashboard/market')
  
  // This is necessary to satisfy TypeScript but will never be executed
  return null
}

// PPR PLAN: The market page is a candidate for Partial Pre-Rendering (PPR).
// - Static: Page metadata, headings, tab structure, timeframe buttons.
// - Dynamic: MarketMetrics, MarketTrendChart, MarketSentiment (real-time market data).
// Next step: Use Next.js 15 PPR API to statically render layout/headings/tabs, dynamically render market modules. 