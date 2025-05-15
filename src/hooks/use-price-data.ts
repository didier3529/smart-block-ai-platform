import { useState, useEffect } from 'react';
import { PriceFetcher } from '@/lib/services/price-fetcher';
import { DEFAULT_TRADING_PAIRS } from '@/config/api-keys';

interface PriceData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  lastUpdate: Date;
}

export function usePriceData(symbols: string[] = DEFAULT_TRADING_PAIRS) {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const priceFetcher = PriceFetcher.getInstance();

    const updatePrices = async () => {
      try {
        const newPrices = await priceFetcher.getPrices(symbols);
        setPrices(newPrices);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch prices'));
      } finally {
        setIsLoading(false);
      }
    };

    // Start polling
    priceFetcher.startPolling(symbols);
    updatePrices();

    // Cleanup
    return () => {
      priceFetcher.stopPolling();
    };
  }, [symbols.join(',')]); // Only re-run if symbols array changes

  return { prices, isLoading, error };
} 