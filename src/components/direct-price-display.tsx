'use client';

import { useEffect, useState } from 'react';
import { PriceFetcher } from '@/lib/services/price-fetcher';
import { PriceFetcherConfig } from '@/config/price-fetcher-config';
import { MoreHorizontal, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CryptoIcon } from '@/components/ui/crypto-icon';

// The symbols we want to display
const SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];

// Symbol to full name mapping
const SYMBOL_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'ADA': 'Cardano',
  'DOT': 'Polkadot',
};

interface DirectPriceData {
  symbol: string;
  price: number;
  historical: number;  
  priceChange: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sentiment: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
}

export default function DirectPriceDisplay() {
  const [prices, setPrices] = useState<Record<string, DirectPriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"1d" | "1w" | "1m" | "1y">("1d");

  useEffect(() => {
    async function fetchPrices() {
      try {
        const priceFetcher = PriceFetcher.getInstance();
        
        // Start polling for these symbols
        const apiSymbols = SYMBOLS.map(s => 
          s.toUpperCase().endsWith('USDT') ? s.toUpperCase() : `${s.toUpperCase()}USDT`
        );
        
        console.log('[DirectPrice] Starting to poll for symbols:', apiSymbols);
        priceFetcher.startPolling(apiSymbols);
        
        // Give it a moment to fetch initial data
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now retrieve the data
        const results: Record<string, DirectPriceData> = {};
        
        for (const baseSymbol of SYMBOLS) {
          const apiSymbol = baseSymbol.toUpperCase().endsWith('USDT') 
            ? baseSymbol.toUpperCase() 
            : `${baseSymbol.toUpperCase()}USDT`;
            
          // Get data directly from PriceFetcher
          const priceData = await priceFetcher.getPrice(apiSymbol);
          console.log(`[DirectPrice] Raw data for ${apiSymbol}:`, priceData);
          
          if (priceData) {
            const changePercent = priceData.historical !== 0 
              ? ((priceData.price - priceData.historical) / priceData.historical) * 100 
              : 0;
             
            // Determine sentiment based on price change
            let sentiment: DirectPriceData['sentiment'] = 'Neutral';
            if (changePercent > 5) sentiment = 'Very Bullish';
            else if (changePercent > 0) sentiment = 'Bullish';
            else if (changePercent < -5) sentiment = 'Very Bearish';
            else if (changePercent < 0) sentiment = 'Bearish';
            
            // Volume and market cap are estimated based on price and a multiplier
            // This is just for demonstration since we don't have real data
            const volume = priceData.volume || priceData.price * (Math.random() * 10000 + 1000);
            const marketCap = priceData.price * (Math.random() * 1000000 + 100000);
              
            results[baseSymbol] = {
              symbol: baseSymbol,
              price: priceData.price,
              historical: priceData.historical,
              priceChange: priceData.price - priceData.historical,
              changePercent,
              volume,
              marketCap,
              sentiment
            };
          } else {
            console.warn(`[DirectPrice] No data found for ${apiSymbol}`);
          }
        }
        
        console.log('[DirectPrice] Final processed results:', results);
        setPrices(results);
        setLoading(false);
        
        // Keep polling active and update every few seconds
        const interval = setInterval(async () => {
          const updatedResults = { ...results };
          
          for (const baseSymbol of SYMBOLS) {
            const apiSymbol = baseSymbol.toUpperCase().endsWith('USDT') 
              ? baseSymbol.toUpperCase() 
              : `${baseSymbol.toUpperCase()}USDT`;
              
            const priceData = await priceFetcher.getPrice(apiSymbol);
            if (priceData) {
              const changePercent = priceData.historical !== 0 
                ? ((priceData.price - priceData.historical) / priceData.historical) * 100 
                : 0;
              
              // Determine sentiment based on price change
              let sentiment: DirectPriceData['sentiment'] = 'Neutral';
              if (changePercent > 5) sentiment = 'Very Bullish';
              else if (changePercent > 0) sentiment = 'Bullish';
              else if (changePercent < -5) sentiment = 'Very Bearish';
              else if (changePercent < 0) sentiment = 'Bearish';
                
              // Update volume and market cap based on new price
              const volume = priceData.volume || updatedResults[baseSymbol]?.volume || priceData.price * (Math.random() * 10000 + 1000);
              const marketCap = updatedResults[baseSymbol]?.marketCap || priceData.price * (Math.random() * 1000000 + 100000);
                
              updatedResults[baseSymbol] = {
                symbol: baseSymbol,
                price: priceData.price,
                historical: priceData.historical,
                priceChange: priceData.price - priceData.historical,
                changePercent,
                volume,
                marketCap,
                sentiment
              };
            }
          }
          
          setPrices(updatedResults);
        }, 5000);
        
        return () => {
          clearInterval(interval);
          priceFetcher.stopPolling();
        };
      } catch (err) {
        console.error('[DirectPrice] Error fetching prices:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
    
    fetchPrices();
  }, []);
  
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="flex animate-pulse flex-col space-y-4">
          <div className="h-6 w-48 rounded bg-gray-700"></div>
          <div className="h-4 w-24 rounded bg-gray-700"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-gray-700"></div>
                <div className="h-4 w-20 rounded bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Market Trend Analysis</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex space-x-2">
        {(["1d", "1w", "1m", "1y"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              timeframe === t
                ? "bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white",
            )}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs font-medium text-gray-400">
              <th className="pb-2">Asset</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">24h Change</th>
              <th className="pb-2 text-right">Volume</th>
              <th className="pb-2 text-right">Market Cap</th>
              <th className="pb-2 text-right">Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {SYMBOLS.map(symbol => {
              const data = prices[symbol];
              if (!data) return null;
              
              const formattedPrice = `$${data.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}`;
              
              const changeClass = data.changePercent >= 0 ? 'text-green-400' : 'text-red-400';
              const changePrefix = data.changePercent >= 0 ? '+' : '';
              const formattedChange = `${changePrefix}${data.changePercent.toFixed(2)}%`;
              
              // Format volume and market cap to billions/millions
              const formattedVolume = `$${(data.volume / 1000000000).toFixed(2)}B`;
              const formattedMarketCap = `$${(data.marketCap / 1000000000).toFixed(2)}B`;
              
              // Determine sentiment class
              const sentimentClass = 
                data.sentiment === 'Bullish' ? 'bg-green-400/10 text-green-400' :
                data.sentiment === 'Very Bullish' ? 'bg-green-500/10 text-green-500' :
                data.sentiment === 'Bearish' ? 'bg-red-400/10 text-red-400' :
                'bg-gray-400/10 text-gray-400';
              
              return (
                <tr key={symbol} className="text-sm">
                  <td className="py-3">
                    <div className="flex items-center">
                      <CryptoIcon symbol={symbol} size="md" className="mr-2" />
                      <div>
                        <div className="font-medium text-white">{symbol}</div>
                        <div className="text-xs text-gray-400">{SYMBOL_NAMES[symbol]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium text-white">{formattedPrice}</td>
                  <td className={cn("py-3 text-right font-medium", changeClass)}>
                    <span className="flex items-center justify-end">
                      {data.changePercent >= 0 ? (
                        <ArrowUp className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDown className="mr-1 h-3 w-3" />
                      )}
                      {formattedChange}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-white">{formattedVolume}</td>
                  <td className="py-3 text-right font-medium text-white">{formattedMarketCap}</td>
                  <td className="py-3 text-right">
                    <span className={cn("rounded-full px-2 py-1 text-xs font-medium", sentimentClass)}>
                      {data.sentiment}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 