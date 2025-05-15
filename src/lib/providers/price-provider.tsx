'use client';

import { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import marketDataAdapter, { MarketPrice } from '@/lib/services/market-data-adapter'
import { PriceFetcherConfig } from '@/config/price-fetcher-config'
import { toast } from '@/components/ui/use-toast'
import { PriceFetcher } from '@/lib/services/price-fetcher'

// TokenPrice now includes isMock
export type TokenPrice = MarketPrice;

interface PriceContextType {
  prices: Record<string, TokenPrice>
  status: 'pending' | 'error' | 'success'
  isFetching: boolean // To indicate background updates
  error: Error | null
  refetchPrices: (symbols?: string[]) => void
  subscribeToPrices: (symbols: string[]) => () => void
  unsubscribeFromPrices: (symbols: string[]) => void
}

const PriceContext = createContext<PriceContextType | undefined>(undefined)

// Function to generate placeholder data
const generatePlaceholderData = (symbols: string[]): Record<string, TokenPrice> => {
  const placeholder: Record<string, TokenPrice> = {}
  symbols.forEach(symbol => {
    placeholder[symbol] = {
      symbol: symbol,
      current: 0,
      historical: 0,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: Date.now(),
      isMock: true // Mark as mock
    }
  })
  return placeholder
}

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const subscribedSymbolsRef = useRef(new Set<string>())
  const [symbolVersion, setSymbolVersion] = useState(0); // State to track changes to the Set
  const priceFetcherInstance = useMemo(() => PriceFetcher.getInstance(), []); // Memoize instance

  // --- Stabilized Dependencies --- 
  // Stable string representation of subscribed symbols, recalculated only when symbolVersion changes
  const stableSymbolString = useMemo(() => {
    return Array.from(subscribedSymbolsRef.current).sort().join(',');
  }, [symbolVersion]); // Depends only on the version counter

  // Memoized array, recalculated only when symbolVersion changes
  const subscribedSymbolsArray = useMemo(() => {
    return Array.from(subscribedSymbolsRef.current);
  }, [symbolVersion]); // Depends only on the version counter

  // Query key uses the stable string representation
  const queryKey = useMemo(() => ['prices', stableSymbolString], [stableSymbolString]);

  // Effect to manage PriceFetcher polling based on subscribedSymbolsArray
  useEffect(() => {
    if (subscribedSymbolsArray.length > 0) {
      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] Detected subscribed symbols, starting PriceFetcher polling:', subscribedSymbolsArray);
      }
      priceFetcherInstance.startPolling(subscribedSymbolsArray);
    } else {
      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] No subscribed symbols, stopping PriceFetcher polling.');
      }
      priceFetcherInstance.stopPolling();
    }
    // Cleanup: Stop polling when the provider unmounts or before restarting with new symbols
    return () => {
      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] Cleanup: stopping PriceFetcher polling.');
      }
      priceFetcherInstance.stopPolling();
    };
  }, [subscribedSymbolsArray, priceFetcherInstance]); // Re-run when the array of symbols changes

  const {
    data: prices,
    isFetching,
    status,
    error: queryError,
    refetch: actualRefetchQuery
  } = useQuery<Record<string, TokenPrice>>({
    queryKey: queryKey,
    queryFn: async () => {
      const symbolsToFetch = subscribedSymbolsArray;
      if (symbolsToFetch.length === 0) return {};

      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] Fetching prices for:', symbolsToFetch);
      }

      const pricePromises = symbolsToFetch.map(symbol =>
        marketDataAdapter.getPrice(symbol)
      );

      const results = await Promise.all(pricePromises);
      const newPrices: Record<string, TokenPrice> = {};

      results.forEach(price => {
        if (price && price.symbol) {
          newPrices[price.symbol] = price;
        }
      });

      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] Fetched prices:', newPrices);
      }

      return newPrices;
    },
    enabled: subscribedSymbolsArray.length > 0,
    refetchInterval: PriceFetcherConfig.pollingInterval,
    retry: PriceFetcherConfig.maxRetries,
    retryDelay: (attemptIndex) => Math.min(PriceFetcherConfig.retryInterval * 2 ** attemptIndex, 30000),
    placeholderData: () => generatePlaceholderData(subscribedSymbolsArray),
    staleTime: PriceFetcherConfig.pollingInterval / 2,
  });

  // Log status changes in development
  useEffect(() => {
    if (PriceFetcherConfig.verbose) {
      if (status === 'pending') {
        console.log('[PriceProvider] Loading prices...');
      } else if (status === 'error') {
        console.error('[PriceProvider] Error loading prices:', queryError);
      } else if (status === 'success') {
        console.log('[PriceProvider] Prices updated:', prices);
      }
    }
  }, [status, queryError, prices]);

  const subscribeToPrices = useCallback((symbolsToSubscribe: string[]) => {
    const currentSubs = subscribedSymbolsRef.current;
    let changed = false;
    const newSymbols: string[] = [];

    symbolsToSubscribe.forEach(s => {
      const apiSymbol = s.toUpperCase().endsWith('USDT') ? s.toUpperCase() : `${s.toUpperCase()}USDT`;
      if (!currentSubs.has(apiSymbol)) {
        currentSubs.add(apiSymbol); // Store with consistent API format (e.g. BTCUSDT)
        newSymbols.push(s); // Keep original for logging/external use if needed
        changed = true;
      }
    });

    if (changed) {
      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] Subscribing to prices for (triggering update):', newSymbols);
      }
      setSymbolVersion(v => v + 1);
    }

    return () => unsubscribeFromPrices(symbolsToSubscribe);
  }, [priceFetcherInstance]); // Added priceFetcherInstance if it were used here, but it's used in useEffect

  const unsubscribeFromPrices = useCallback((symbolsToUnsubscribe: string[]) => {
    const currentSubs = subscribedSymbolsRef.current;
    let changed = false;

    symbolsToUnsubscribe.forEach(s => {
      const apiSymbol = s.toUpperCase().endsWith('USDT') ? s.toUpperCase() : `${s.toUpperCase()}USDT`;
      if (currentSubs.has(apiSymbol)) {
        currentSubs.delete(apiSymbol);
        changed = true;
      }
    });

    if (changed) {
      if (PriceFetcherConfig.verbose) {
        console.log('[PriceProvider] Unsubscribing from prices for (triggering update):', symbolsToUnsubscribe);
      }
      setSymbolVersion(v => v + 1);
    }
  }, [priceFetcherInstance]); // Added priceFetcherInstance if it were used here

  const refetchPrices = useCallback((symbols?: string[]) => {
    if (symbols) {
      // Update subscriptions if new symbols are provided
      subscribeToPrices(symbols);
    }
    return actualRefetchQuery();
  }, [subscribeToPrices, actualRefetchQuery]);

  const contextValue = useMemo(() => ({
    prices: prices ?? {},
    status,
    isFetching,
    error: queryError as Error | null,
    refetchPrices,
    subscribeToPrices,
    unsubscribeFromPrices,
  }), [prices, status, isFetching, queryError, refetchPrices, subscribeToPrices, unsubscribeFromPrices]);

  return (
    <PriceContext.Provider value={contextValue}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePriceContext() {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePriceContext must be used within a PriceProvider');
  }
  return context;
}

export function useTokenPrice(symbol: string) {
  const { prices, status, isFetching, error, subscribeToPrices, unsubscribeFromPrices } = usePriceContext();

  useEffect(() => {
    const unsubscribe = subscribeToPrices([symbol]);
    return () => {
      unsubscribe();
    };
  }, [symbol, subscribeToPrices]);

  return {
    price: prices[symbol],
    isLoading: status === 'pending',
    isFetching,
    error,
  };
}

export function useTokenPrices(symbols: string[]) {
  const { prices, status, isFetching, error, subscribeToPrices, unsubscribeFromPrices } = usePriceContext();

  useEffect(() => {
    const unsubscribe = subscribeToPrices(symbols);
    return () => {
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(','), subscribeToPrices]);

  // Create an object that maps base symbols (like "BTC") to their data
  const selectedPrices = useMemo(() => {
    // This function needs to handle the mapping from normalized API symbols like "BTCUSDT" 
    // back to base symbols like "BTC" which the UI components expect
    const result: Record<string, TokenPrice> = {};
    
    // For each symbol the component wants (e.g., "BTC", "ETH")
    symbols.forEach(baseSymbol => {
      // Convert to what API expects (e.g., "BTCUSDT")
      const apiSymbol = baseSymbol.toUpperCase().endsWith('USDT') 
        ? baseSymbol.toUpperCase() 
        : `${baseSymbol.toUpperCase()}USDT`;
        
      // Find the price data using the API symbol from the context
      const priceData = prices[apiSymbol];
      
      if (priceData) {
        // Store it under the BASE symbol (e.g., "BTC") which the UI components expect
        result[baseSymbol] = priceData;
      } else {
        console.warn(`[useTokenPrices] No price data found for ${apiSymbol} when looking up ${baseSymbol}`);
      }
    });
    
    return result;
  }, [symbols, prices]);

  return {
    prices: selectedPrices,
    isLoading: status === 'pending',
    isFetching,
    error,
  };
} 