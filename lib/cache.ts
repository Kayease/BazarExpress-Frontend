// Simple in-memory cache with TTL (Time To Live)
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new SimpleCache();

// Cached fetch function
export async function cachedFetch<T>(
  url: string, 
  options?: RequestInit,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options || {})}`;
  
  // Check cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Cache the result
  apiCache.set(cacheKey, data, ttlMs);
  
  return data;
}

// Clean up expired cache items every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}