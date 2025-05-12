"use client"

import React from 'react'
import { Card } from "@/components/ui/card"
import { usePortfolio } from "@/lib/hooks/use-portfolio"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Asset } from '@/types/common'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#6366F1", // indigo-500
  "#EC4899", // pink-500
  "#F59E0B", // amber-500
  "#8B5CF6", // violet-500
  "#EF4444", // red-500
  "#14B8A6", // teal-500
]

const DEFAULT_TIMEFRAME = "1w"
const DEFAULT_NETWORK = "ethereum"

interface PortfolioAllocationProps {
  portfolio: {
    tokens: Asset[]
    totalValue: number
  }
}

export function PortfolioAllocation({ portfolio }: PortfolioAllocationProps) {
  const { data: portfolioData, isLoading } = usePortfolio({ timeframe: DEFAULT_TIMEFRAME, network: DEFAULT_NETWORK })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Asset Allocation</h2>
          <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <Skeleton className="h-[350px] w-full" />
      </div>
    )
  }

  const data = portfolio?.tokens.map((asset, index) => ({
    name: asset.symbol,
    value: (asset.value / portfolio.totalValue) * 100,
    color: COLORS[index % COLORS.length],
  }))

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Asset Allocation</h2>
          <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No portfolio data available
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Asset Allocation</h2>
        <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.5rem",
                padding: "0.5rem",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number) => [`${value.toFixed(2)}%`]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="space-y-2">
                  {payload?.slice(0, 5).map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="h-3 w-3 rounded-full mr-2"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-white">{entry.value}</span>
                      </div>
                      <span className="text-sm text-white">{data[index].value.toFixed(1)}%</span>
                    </div>
                  ))}
                  {data.length > 5 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-gray-600 mr-2" />
                        <span className="text-sm text-white">Others</span>
                      </div>
                      <span className="text-sm text-white">
                        {data
                          .slice(5)
                          .reduce((sum, item) => sum + item.value, 0)
                          .toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 