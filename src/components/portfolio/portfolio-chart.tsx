"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePortfolio } from "@/lib/hooks/use-portfolio"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

type TimeFrame = "1d" | "1w" | "1m" | "1y"

const timeFrameOptions: { label: string; value: TimeFrame }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "1Y", value: "1y" },
]

const DEFAULT_NETWORK = "ethereum"

export function PortfolioChart() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1d")
  const { data: portfolio, isLoading } = usePortfolio({ timeframe: timeFrame, network: DEFAULT_NETWORK })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Portfolio Performance</CardTitle>
            <div className="flex items-center gap-2">
              {timeFrameOptions.map((option) => (
                <Skeleton key={option.value} className="h-8 w-12" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // Mock data for now - will be replaced with real data from the API
  const data = [
    { timestamp: "2024-03-01", value: 10000 },
    { timestamp: "2024-03-02", value: 10500 },
    { timestamp: "2024-03-03", value: 10300 },
    { timestamp: "2024-03-04", value: 10800 },
    { timestamp: "2024-03-05", value: 11200 },
    { timestamp: "2024-03-06", value: 11000 },
    { timestamp: "2024-03-07", value: 11500 },
  ]

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    switch (timeFrame) {
      case "1d":
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      case "1w":
        return date.toLocaleDateString("en-US", { weekday: "short" })
      case "1m":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      case "1y":
        return date.toLocaleDateString("en-US", { month: "short" })
    }
  }

  const percentageChange = ((data[data.length - 1].value - data[0].value) / data[0].value) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Portfolio Performance</CardTitle>
            <div className="mt-1 text-2xl font-bold">
              {formatValue(data[data.length - 1].value)}
              <span
                className={`ml-2 text-sm font-normal ${
                  percentageChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {percentageChange >= 0 ? "+" : ""}
                {percentageChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timeFrameOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeFrame === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFrame(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                stroke="#6B7280"
                tick={{ fill: "#6B7280" }}
              />
              <YAxis
                tickFormatter={formatValue}
                stroke="#6B7280"
                tick={{ fill: "#6B7280" }}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(data.timestamp)}
                      </div>
                      <div className="font-medium">{formatValue(data.value)}</div>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 