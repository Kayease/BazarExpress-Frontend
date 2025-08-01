"use client";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_PREFIX = 'bazarxpress_cache_';

  // Memory cache methods
  setMemoryCache<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.memoryCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  // LocalStorage cache methods
  setLocalStorage<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    if (typeof window === 'undefined') return;

    try {
      const now = Date.now();
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl
      };
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  getLocalStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();

      if (now > cacheItem.expiresAt) {
        localStorage.removeItem(this.STORAGE_PREFIX + key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  // Combined cache methods (memory first, then localStorage)
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.setMemoryCache(key, data, ttl);
    this.setLocalStorage(key, data, ttl);
  }

  get<T>(key: string): T | null {
    // Try memory cache first
    let data = this.getMemoryCache<T>(key);
    if (data) return data;

    // Fallback to localStorage
    data = this.getLocalStorage<T>(key);
    if (data) {
      // Restore to memory cache
      this.setMemoryCache(key, data);
      return data;
    }

    return null;
  }

  // Clear specific cache
  clear(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
    }
  }

  // Clear all cache
  clearAll(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Generate cache key with location context
  generateLocationKey(baseKey: string, pincode?: string, isGlobalMode?: boolean): string {
    if (!pincode) return baseKey;
    return `${baseKey}_${pincode}_${isGlobalMode ? 'global' : 'local'}`;
  }

  // Clean expired items
  cleanExpired(): void {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '');
            if (now > item.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove corrupted items
            localStorage.removeItem(key);
          }
        }
      });
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Auto-cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheService.cleanExpired();
  }, 10 * 60 * 1000);
}