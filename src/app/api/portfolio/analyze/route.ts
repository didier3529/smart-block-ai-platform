import { NextResponse } from "next/server"
import { PortfolioAnalyst } from "@/ai/agents/PortfolioAnalyst"
import { PromptManager } from "@/ai/core/PromptManager"
import { getPortfolioData } from "@/lib/services/portfolio-service"
import { FilePromptRepository } from "@/ai/prompts/FilePromptRepository"

const promptRepository = new FilePromptRepository("./prompts")
const promptManager = new PromptManager(promptRepository)

const portfolioAnalyst = new PortfolioAnalyst({
  id: "portfolio-analyst-1",
  name: "Portfolio Analyst",
  modelConfig: { provider: "openai", model: "gpt-4" },
  modelName: "default-model",
  capabilities: ["portfolio analysis", "risk assessment", "investment recommendations"],
  analysisThresholds: {
    riskTolerance: 0.5,
    minimumHoldingValue: "1000"
  }
}, promptManager)

export async function GET() {
  try {
    // Get current portfolio data
    const portfolio = await getPortfolioData("1d")
    
    // Convert portfolio data to the format expected by the analyst
    const holdings = portfolio.assets.map(asset => ({
      token: asset.symbol,
      amount: asset.balance,
      value: asset.value
    }))

    // Get analysis from the AI agent
    const analysis = await portfolioAnalyst.analyzePortfolio(holdings)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Portfolio Analysis Error:", error)
    return NextResponse.json(
      { error: "Failed to analyze portfolio" },
      { status: 500 }
    )
  }
} 