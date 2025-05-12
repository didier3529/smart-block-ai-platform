import { memo } from 'react'
import { AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContractDetailsProps {
  analysis: {
    name: string
    address: string
    risk: string
    issues: number
    timestamp: string
  }
}

function ContractDetailsComponent({ analysis }: ContractDetailsProps) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
      <div className="flex items-center space-x-3">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            analysis.risk === "Low"
              ? "bg-green-400"
              : analysis.risk === "Medium"
              ? "bg-yellow-400"
              : "bg-red-400",
          )}
        />
        <div>
          <div className="text-sm font-medium text-white">{analysis.name}</div>
          <div className="text-xs text-gray-400">{analysis.address}</div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            "text-sm font-medium",
            analysis.risk === "Low"
              ? "text-green-400"
              : analysis.risk === "Medium"
              ? "text-yellow-400"
              : "text-red-400",
          )}
        >
          {analysis.risk}
        </div>
        <div className="flex items-center text-xs text-gray-400">
          {analysis.issues > 0 ? (
            <AlertCircle className="mr-1 h-3 w-3 text-red-400" />
          ) : (
            <CheckCircle className="mr-1 h-3 w-3 text-green-400" />
          )}
          {analysis.issues} {analysis.issues === 1 ? "issue" : "issues"} · {analysis.timestamp}
        </div>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ContractDetailsComponent) 