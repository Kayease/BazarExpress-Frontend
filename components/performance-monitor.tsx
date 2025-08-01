"use client";

import { useEffect } from 'react';
import { cacheService } from '@/lib/cache-service';

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  averageLoadTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    averageLoadTime: 0
  };

  private loadTimes: number[] = [];

  recordCacheHit() {
    this.metrics.cacheHits++;
    this.metrics.totalRequests++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
    this.metrics.totalRequests++;
  }

  recordLoadTime(time: number) {
    this.loadTimes.push(time);
    this.metrics.averageLoadTime = this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length;
    
    // Keep only last 100 measurements
    if (this.loadTimes.length > 100) {
      this.loadTimes = this.loadTimes.slice(-100);
    }
  }

  getMetrics(): PerformanceMetrics & { cacheHitRate: number } {
    const cacheHitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      cacheHitRate
    };
  }

  logMetrics() {
    const metrics = this.getMetrics();
    console.group('🚀 BazarXpress Performance Metrics');
    console.log(`Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Cache Hits: ${metrics.cacheHits}`);
    console.log(`Cache Misses: ${metrics.cacheMisses}`);
    console.log(`Average Load Time: ${metrics.averageLoadTime.toFixed(0)}ms`);
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook to monitor performance in development
export function usePerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        performanceMonitor.logMetrics();
      }, 30000); // Log every 30 seconds in development

      return () => clearInterval(interval);
    }
  }, []);

  return performanceMonitor;
}

// Enhanced cache service with performance monitoring
export const monitoredCacheService = {
  ...cacheService,
  
  get<T>(key: string): T | null {
    const startTime = performance.now();
    const result = cacheService.get<T>(key);
    const endTime = performance.now();
    
    if (result) {
      performanceMonitor.recordCacheHit();
    } else {
      performanceMonitor.recordCacheMiss();
    }
    
    performanceMonitor.recordLoadTime(endTime - startTime);
    return result;
  },

  set<T>(key: string, data: T, ttl?: number): void {
    const startTime = performance.now();
    cacheService.set(key, data, ttl);
    const endTime = performance.now();
    
    performanceMonitor.recordLoadTime(endTime - startTime);
  },

  // Include the generateLocationKey method
  generateLocationKey(baseKey: string, pincode?: string, isGlobalMode?: boolean): string {
    return cacheService.generateLocationKey(baseKey, pincode, isGlobalMode);
  }
};

export default function PerformanceMonitorComponent() {
  usePerformanceMonitor();
  return null; // This component doesn't render anything
}