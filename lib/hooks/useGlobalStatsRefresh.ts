import { create } from 'zustand';

interface GlobalStatsStore {
  refreshTrigger: number;
  triggerRefresh: () => void;
  lastRefreshTime: number;
}

// Global store for stats refresh across all admin sections
export const useGlobalStatsStore = create<GlobalStatsStore>((set) => ({
  refreshTrigger: 0,
  lastRefreshTime: Date.now(),
  triggerRefresh: () => set((state) => ({ 
    refreshTrigger: state.refreshTrigger + 1,
    lastRefreshTime: Date.now()
  })),
}));

// Hook to trigger global stats refresh
export const useGlobalStatsRefresh = () => {
  const { triggerRefresh } = useGlobalStatsStore();
  return triggerRefresh;
};

// Hook to listen for global stats refresh
export const useGlobalStatsListener = () => {
  const { refreshTrigger, lastRefreshTime } = useGlobalStatsStore();
  return { refreshTrigger, lastRefreshTime };
};