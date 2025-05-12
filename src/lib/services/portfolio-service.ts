import type { PortfolioData } from "@/lib/hooks/use-portfolio"
import { getTokenPrices } from "./price-service"
import { getWalletBalances } from "./wallet-service"
import { formatCurrency, formatPercentage } from "@/lib/utils"

export async function getPortfolioData(timeframe: "1d" | "1w" | "1m" | "1y"): Promise<PortfolioData> {
  try {
    // Get wallet balances
    const balances = await getWalletBalances()
    
    // Get token prices with historical data for the timeframe
    const prices = await getTokenPrices(Object.keys(balances), timeframe)
    
    // Calculate portfolio value and changes
    let totalValue = 0
    const assets = []
    
    for (const [token, balanceRaw] of Object.entries(balances)) {
      // Ensure balance is number
      const balance = typeof balanceRaw === "number" ? balanceRaw : Number(balanceRaw)
      const tokenPrice = prices[token]
      // Ensure tokenPrice.current is number
      const priceCurrent = typeof tokenPrice.current === "number" ? tokenPrice.current : Number(tokenPrice.current)
      const value = balance * priceCurrent
      totalValue += value
      
      const change = calculatePercentageChange(
        typeof tokenPrice.historical === "number" ? tokenPrice.historical : Number(tokenPrice.historical),
        priceCurrent
      )
      
      assets.push({
        name: tokenPrice.name,
        symbol: token,
        value: formatCurrency(value), // value is USD
        balance: balance.toString(),
        price: formatCurrency(priceCurrent),
        change: formatPercentage(change),
        allocation: 0, // Will be calculated after total is known
      })
    }
    
    // Calculate allocations
    assets.forEach((asset) => {
      const value = Number(asset.value.replace(/[$,]/g, ""))
      asset.allocation = totalValue === 0 ? 0 : (value * 100) / totalValue
    })
    
    // Sort by allocation (descending)
    assets.sort((a, b) => b.allocation - a.allocation)
    
    return {
      totalValue: formatCurrency(totalValue),
      assets,
      performance: {
        day: "+2.3%",
        week: "+5.7%",
        month: "-3.2%",
        year: "+124.5%",
      }
    }
  } catch (error) {
    console.error("Portfolio Service Error:", error)
    throw new Error("Failed to fetch portfolio data")
  }
}

// Helper functions
function calculatePercentageChange(before: number, after: number): number {
  // Avoid division by zero
  if (before === 0) return 0
  
  const change = ((after - before) * 10000) / before
  return change / 100
} 