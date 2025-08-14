import { useEffect, useCallback, useState } from 'react';
import { useGlobalStatsListener } from './useGlobalStatsRefresh';

interface UseAdminStatsRefreshOptions {
  onRefresh?: () => void | Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export const useAdminStatsRefresh = (options: UseAdminStatsRefreshOptions = {}) => {
  const { onRefresh, debounceMs = 500, enabled = true } = options;
  const { refreshTrigger, lastRefreshTime } = useGlobalStatsListener();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastProcessedTrigger, setLastProcessedTrigger] = useState(0);

  // Debounced refresh function
  const debouncedRefresh = useCallback(
    async (trigger: number) => {
      if (!enabled || !onRefresh || trigger <= lastProcessedTrigger) {
        return;
      }

      setIsRefreshing(true);
      setLastProcessedTrigger(trigger);

      try {
        await onRefresh();
        console.log(`📊 Stats refreshed for trigger #${trigger} at ${new Date(lastRefreshTime).toLocaleTimeString()}`);
      } catch (error) {
        console.error('❌ Error refreshing stats:', error);
      } finally {
        setIsRefreshing(false);
      }
    },
    [enabled, onRefresh, lastProcessedTrigger, lastRefreshTime]
  );

  // Effect to handle refresh triggers with debouncing
  useEffect(() => {
    if (refreshTrigger <= lastProcessedTrigger) {
      return;
    }

    const timeoutId = setTimeout(() => {
      debouncedRefresh(refreshTrigger);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [refreshTrigger, debouncedRefresh, debounceMs, lastProcessedTrigger]);

  return {
    isRefreshing,
    refreshTrigger,
    lastRefreshTime,
    forceRefresh: () => debouncedRefresh(refreshTrigger + 1)
  };
};