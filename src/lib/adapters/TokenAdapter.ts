import { BlockchainDataAdapter } from "./BlockchainDataAdapter"
import { api } from "@/lib/api"

export interface TokenData {
  name: string
  symbol: string
  address: string
  decimals: number
  totalSupply: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  holders: number
  transfers24h: number
}

export interface TokenBalance {
  token: TokenData
  balance: string
  value: number
}

export interface TokenMarketData {
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  lastUpdated: string
}

interface TokenPriceUpdate {
  symbol: string
  price: number
  timestamp: number
  change24h: number
}

interface TokenTransfer {
  from: string
  to: string
  tokenId: string
  amount: string
  timestamp: number
  transactionHash: string
}

export class TokenAdapter extends BlockchainDataAdapter {
  private cache: Map<string, TokenData> = new Map()
  private marketDataCache: Map<string, TokenMarketData> = new Map()
  private balanceCache: Map<string, TokenBalance[]> = new Map()
  private priceUpdateHandlers: Set<(update: TokenPriceUpdate) => void> = new Set()
  private transferHandlers: Set<(transfer: TokenTransfer) => void> = new Set()

  constructor(wsUrl: string) {
    super(wsUrl)
    this.setupWebSocket()
  }

  private setupWebSocket() {
    // Subscribe to token price updates
    this.subscribeToEvent<TokenPriceUpdate>("token_price_update", (data) => {
      this.priceUpdateHandlers.forEach(handler => handler(data))
    })

    // Subscribe to token transfer events
    this.subscribeToEvent<TokenTransfer>("token_transfer", (data) => {
      this.transferHandlers.forEach(handler => handler(data))
    })
  }

  public onPriceUpdate(handler: (update: TokenPriceUpdate) => void): () => void {
    this.priceUpdateHandlers.add(handler)
    return () => this.priceUpdateHandlers.delete(handler)
  }

  public onTransfer(handler: (transfer: TokenTransfer) => void): () => void {
    this.transferHandlers.add(handler)
    return () => this.transferHandlers.delete(handler)
  }

  public async getTokenPrice(symbol: string): Promise<TokenPriceUpdate> {
    return new Promise((resolve, reject) => {
      try {
        this.sendWebSocketMessage("get_token_price", { symbol })
        const handler = (data: TokenPriceUpdate) => {
          if (data.symbol === symbol) {
            this.priceUpdateHandlers.delete(handler)
            resolve(data)
          }
        }
        this.priceUpdateHandlers.add(handler)

        // Timeout after 10 seconds
        setTimeout(() => {
          this.priceUpdateHandlers.delete(handler)
          reject(new Error(`Timeout getting price for ${symbol}`))
        }, 10000)
      } catch (error) {
        reject(error)
      }
    })
  }

  public async getTokenTransfers(address: string, startBlock?: number): Promise<TokenTransfer[]> {
    return new Promise((resolve, reject) => {
      try {
        this.sendWebSocketMessage("get_token_transfers", { address, startBlock })
        const transfers: TokenTransfer[] = []
        const handler = (transfer: TokenTransfer) => {
          if (transfer.from === address || transfer.to === address) {
            transfers.push(transfer)
          }
        }
        this.transferHandlers.add(handler)

        // Collect transfers for 5 seconds then resolve
        setTimeout(() => {
          this.transferHandlers.delete(handler)
          resolve(transfers)
        }, 5000)
      } catch (error) {
        reject(error)
      }
    })
  }

  async getTokenData(address: string): Promise<TokenData> {
    // Check cache first
    const cached = this.cache.get(address)
    if (cached) {
      return cached
    }

    // Fetch from API
    const { data } = await api.get(`/api/tokens/${address}`)
    this.cache.set(address, data)
    return data
  }

  async getTokenMarketData(address: string): Promise<TokenMarketData> {
    // Check cache first
    const cached = this.marketDataCache.get(address)
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached
    }

    // Fetch from API
    const { data } = await api.get(`/api/tokens/${address}/market`)
    this.marketDataCache.set(address, {
      ...data,
      lastUpdated: new Date().toISOString(),
    })
    return data
  }

  async getWalletTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    // Check cache first
    const cached = this.balanceCache.get(walletAddress)
    if (cached) {
      return cached
    }

    // Fetch from API
    const { data } = await api.get(`/api/wallets/${walletAddress}/tokens`)
    this.balanceCache.set(walletAddress, data)
    return data
  }

  async getTokenHolderStats(address: string): Promise<{
    totalHolders: number
    activeHolders24h: number
    topHolders: { address: string; balance: string; percentage: number }[]
  }> {
    const { data } = await api.get(`/api/tokens/${address}/holders`)
    return data
  }

  async getTokenTransferHistory(
    address: string,
    limit: number = 100,
  ): Promise<{
    timestamp: string
    from: string
    to: string
    amount: string
    value: number
  }[]> {
    const { data } = await api.get(`/api/tokens/${address}/transfers?limit=${limit}`)
    return data
  }

  private isCacheValid(lastUpdated: string, maxAge: number = 5 * 60 * 1000): boolean {
    const lastUpdate = new Date(lastUpdated).getTime()
    const now = new Date().getTime()
    return now - lastUpdate < maxAge
  }

  clearCache() {
    this.cache.clear()
    this.marketDataCache.clear()
    this.balanceCache.clear()
  }
} 