// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.metrics.set(label, performance.now());
  }

  endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      this.metrics.delete(label);
      return duration;
    }
    return 0;
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    return fn().finally(() => {
      this.endTimer(label);
    });
  }

  measureSync<T>(label: string, fn: () => T): T {
    this.startTimer(label);
    try {
      return fn();
    } finally {
      this.endTimer(label);
    }
  }
}

export const perf = PerformanceMonitor.getInstance();

// React hook for measuring component render time
import { useEffect, useRef } from 'react';

export function useRenderTime(componentName: string) {
  const renderStart = useRef<number>();

  // Start timer before render
  renderStart.current = performance.now();

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current;
      if (renderTime > 16) { // Only log if render takes more than 16ms (60fps threshold)
        console.log(`🔄 ${componentName} render: ${renderTime.toFixed(2)}ms`);
      }
    }
  });
}

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window !== 'undefined') {
    // Monitor Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('📊 LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('📊 FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('📊 CLS:', clsValue);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    let totalSize = 0;

    scripts.forEach(async (script: any) => {
      try {
        const response = await fetch(script.src);
        const size = parseInt(response.headers.get('content-length') || '0');
        totalSize += size;
        console.log(`📦 ${script.src}: ${(size / 1024).toFixed(2)}KB`);
      } catch (error) {
        console.warn('Could not analyze script size:', script.src);
      }
    });

    setTimeout(() => {
      console.log(`📦 Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    }, 1000);
  }
}