interface CacheConfig {
  ttl: number;
  maxSize: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache {
  private store: Map<string, CacheEntry<any>>;
  private ttl: number;
  private maxSize: number;

  constructor(config: CacheConfig) {
    this.store = new Map();
    this.ttl = config.ttl;
    this.maxSize = config.maxSize;
  }

  set(key: string, value: any): void {
    // Clean up old entries if we're at max size
    if (this.store.size >= this.maxSize) {
      this.cleanup();
    }

    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): any | undefined {
    const entry = this.store.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(key);
      }
    }

    // If still over maxSize, remove oldest entries
    if (this.store.size >= this.maxSize) {
      const entries = Array.from(this.store.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = entries.slice(0, entries.length - this.maxSize);
      for (const [key] of entriesToRemove) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
} 