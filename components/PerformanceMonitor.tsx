import React, { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

interface PerformanceMonitorProps {
  onMetrics?: (metrics: PerformanceMetrics) => void;
  enabled?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  onMetrics, 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Measure Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metricsRef.current.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const fcpEntry = entries[0] as PerformanceEntry;
        metricsRef.current.fcp = fcpEntry.startTime;
        onMetrics?.(metricsRef.current);
      }
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const lcpEntry = entries[entries.length - 1] as PerformanceEntry;
        metricsRef.current.lcp = lcpEntry.startTime;
        onMetrics?.(metricsRef.current);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const fidEntry = entries[0] as PerformanceEntry;
        metricsRef.current.fid = fidEntry.processingStart - fidEntry.startTime;
        onMetrics?.(metricsRef.current);
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metricsRef.current.cls = clsValue;
      onMetrics?.(metricsRef.current);
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // Store observers for cleanup
    observerRef.current = {
      fcp: fcpObserver,
      lcp: lcpObserver,
      fid: fidObserver,
      cls: clsObserver,
    } as any;

    // Log initial metrics after a delay
    const timeoutId = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Performance Metrics:', metricsRef.current);
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      
      // Cleanup observers
      if (observerRef.current) {
        Object.values(observerRef.current).forEach(observer => {
          if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
          }
        });
      }
    };
  }, [enabled, onMetrics]);

  // Don't render anything visible
  return null;
};

export default PerformanceMonitor;
