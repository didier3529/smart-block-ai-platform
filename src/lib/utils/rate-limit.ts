/**
 * A simple in-memory rate limiting implementation
 * Note: For production, consider using a distributed solution like Redis
 */

export interface RateLimitOptions {
  interval: number; // time window in milliseconds
  uniqueTokenPerInterval: number; // max number of unique tokens per interval
}

interface TokenEntry {
  count: number;
  timestamp: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options;
  
  // Use a simple Map for token storage
  const tokenCache = new Map<string, TokenEntry>();
  
  // Cleanup function to remove expired tokens
  const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of tokenCache.entries()) {
      if (now - value.timestamp > interval) {
        tokenCache.delete(key);
      }
    }
  };
  
  // Set a periodic cleanup
  if (typeof window === 'undefined') {
    // Only run on server
    setInterval(cleanup, interval);
  }
  
  return {
    /**
     * Check if a token has exceeded its rate limit
     * @param limit Maximum number of requests allowed in the interval
     * @param token Unique identifier for the requester (e.g., IP address or API key)
     * @returns Promise that resolves if under limit, rejects if limit exceeded
     */
    check: async (limit: number, token: string): Promise<void> => {
      // Quick cleanup before checking
      cleanup();
      
      // Generate a unique key by combining the token with the use case
      // This allows different rate limits for different operations
      const timestamp = Date.now();
      const entry = tokenCache.get(token) || { count: 0, timestamp };
      
      // Check if we're in the same time window
      if (timestamp - entry.timestamp > interval) {
        // Reset for new interval
        entry.timestamp = timestamp;
        entry.count = 0;
      }
      
      // Increment and check
      entry.count++;
      tokenCache.set(token, entry);
      
      // Ensure we don't exceed overall unique tokens (memory protection)
      if (tokenCache.size > uniqueTokenPerInterval) {
        // If we have too many unique tokens, delete the oldest ones
        const tokens = Array.from(tokenCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        while (tokenCache.size > uniqueTokenPerInterval * 0.9) { // Remove 10% to avoid constant cleanup
          const oldestToken = tokens.shift();
          if (oldestToken) {
            tokenCache.delete(oldestToken[0]);
          } else {
            break;
          }
        }
      }
      
      // Check if exceeded limit
      if (entry.count > limit) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      
      return Promise.resolve();
    },
    
    /**
     * Get current usage information
     * @param token The token to check
     * @returns Current usage information
     */
    getUsage: (token: string): { count: number; limit: number; remaining: number } | null => {
      const entry = tokenCache.get(token);
      if (!entry) return null;
      
      // Check if entry is expired
      if (Date.now() - entry.timestamp > interval) {
        tokenCache.delete(token);
        return null;
      }
      
      return {
        count: entry.count,
        limit: uniqueTokenPerInterval,
        remaining: Math.max(0, uniqueTokenPerInterval - entry.count),
      };
    },
  };
} 