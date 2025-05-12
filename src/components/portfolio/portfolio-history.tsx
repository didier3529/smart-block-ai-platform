"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePortfolioHistory } from "@/lib/hooks/use-portfolio-history"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/ui/icons"

type TransactionType = "all" | "buy" | "sell" | "transfer" | "swap"

const transactionTypes: { label: string; value: TransactionType }[] = [
  { label: "All", value: "all" },
  { label: "Buy", value: "buy" },
  { label: "Sell", value: "sell" },
  { label: "Transfer", value: "transfer" },
  { label: "Swap", value: "swap" },
]

export function PortfolioHistory() {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<TransactionType>("all")
  const { data: history, isLoading } = usePortfolioHistory()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mock data for now - will be replaced with real data from the API
  const transactions = [
    {
      id: "1",
      type: "buy",
      asset: "Bitcoin",
      symbol: "BTC",
      amount: "0.5",
      price: 45000,
      value: 22500,
      timestamp: "2024-03-07T12:00:00Z",
      status: "completed",
      hash: "0x1234...5678",
    },
    {
      id: "2",
      type: "sell",
      asset: "Ethereum",
      symbol: "ETH",
      amount: "2.0",
      price: 3000,
      value: 6000,
      timestamp: "2024-03-06T15:30:00Z",
      status: "completed",
      hash: "0x5678...9012",
    },
    {
      id: "3",
      type: "transfer",
      asset: "USD Coin",
      symbol: "USDC",
      amount: "1000",
      price: 1,
      value: 1000,
      timestamp: "2024-03-05T09:15:00Z",
      status: "completed",
      hash: "0x9012...3456",
    },
    {
      id: "4",
      type: "swap",
      asset: "Solana",
      symbol: "SOL",
      amount: "10",
      price: 125,
      value: 1250,
      timestamp: "2024-03-04T18:45:00Z",
      status: "completed",
      hash: "0x3456...7890",
    },
  ]

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.asset.toLowerCase().includes(search.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(search.toLowerCase()) ||
      tx.hash.toLowerCase().includes(search.toLowerCase())
    const matchesType = type === "all" || tx.type === type
    return matchesSearch && matchesType
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <Icons.arrowDown className="h-4 w-4 text-green-500" />
      case "sell":
        return <Icons.arrowUp className="h-4 w-4 text-red-500" />
      case "transfer":
        return <Icons.arrowRight className="h-4 w-4 text-blue-500" />
      case "swap":
        return <Icons.refresh className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Icons.filter className="h-4 w-4" />
                  {transactionTypes.find((t) => t.value === type)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {transactionTypes.map((t) => (
                  <DropdownMenuItem key={t.value} onClick={() => setType(t.value)}>
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(tx.type)}
                    <span className="capitalize">{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                    <div>
                      <div className="font-medium">{tx.asset}</div>
                      <div className="text-sm text-muted-foreground">{tx.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">{tx.amount}</TableCell>
                <TableCell className="text-right">{formatCurrency(tx.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(tx.value)}</TableCell>
                <TableCell className="text-right">{formatDate(tx.timestamp)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="capitalize">{tx.status}</span>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <Icons.externalLink className="h-4 w-4" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 