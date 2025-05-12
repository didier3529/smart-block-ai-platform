import { ArrowDown, ArrowUp, Brain, ChartLine, Globe, Lightbulb } from "lucide-react"
import { useTrendAnalysis } from "@/lib/hooks/use-market-trends"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function MarketOverview() {
  const { data: analysis, isLoading } = useTrendAnalysis({
    timeframe: "short",
    includeSocial: true,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="flex items-center gap-4 mb-6">
        <Brain className="h-6 w-6 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">AI Market Analysis</h2>
        <div
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
            analysis.sentiment === "Very Bullish" || analysis.sentiment === "Bullish"
              ? "bg-green-400/10 text-green-400"
              : analysis.sentiment === "Bearish" || analysis.sentiment === "Very Bearish"
              ? "bg-red-400/10 text-red-400"
              : "bg-gray-400/10 text-gray-400",
          )}
        >
          {analysis.sentiment === "Very Bullish" || analysis.sentiment === "Bullish" ? (
            <ArrowUp className="h-3 w-3" />
          ) : analysis.sentiment === "Bearish" || analysis.sentiment === "Very Bearish" ? (
            <ArrowDown className="h-3 w-3" />
          ) : null}
          {analysis.sentiment}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Key Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            Key Insights
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-400/50" />
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Signals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <ChartLine className="h-4 w-4 text-blue-400" />
            Technical Signals
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            {analysis.signals.technical.map((signal, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400/50" />
                {signal}
              </li>
            ))}
          </ul>
        </div>

        {/* Fundamental Signals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Globe className="h-4 w-4 text-purple-400" />
            Fundamental Signals
          </div>
          <ul className="space-y-2 text-sm text-gray-400">
            {analysis.signals.fundamental.map((signal, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400/50" />
                {signal}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Brain className="h-4 w-4 text-green-400" />
            AI Recommendations
          </div>
          <div className="rounded-lg bg-white/5 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium uppercase",
                  analysis.recommendations.action === "buy"
                    ? "bg-green-400/10 text-green-400"
                    : analysis.recommendations.action === "sell"
                    ? "bg-red-400/10 text-red-400"
                    : "bg-yellow-400/10 text-yellow-400",
                )}
              >
                {analysis.recommendations.action}
              </div>
              <div className="text-xs text-gray-400">
                Confidence: {Math.round(analysis.recommendations.confidence * 100)}%
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              {analysis.recommendations.reasoning.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400/50" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 