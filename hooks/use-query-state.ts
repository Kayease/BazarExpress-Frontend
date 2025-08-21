import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function useQueryState(key: string, defaultValue?: string): [string | undefined, (value: string | undefined) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string | undefined>(() => searchParams.get(key) || defaultValue);
  const manuallyUpdated = useRef(false);
  const lastManualValue = useRef<string | undefined>(value);
  const updateInProgress = useRef(false);
  const updateQueue = useRef<string | undefined>(undefined);
  const lastUpdateTime = useRef(Date.now());
  
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[useQueryState:${key}] ${message}`, data || '');
  };

  // Process the update queue
  const processUpdateQueue = useCallback(() => {
    if (updateQueue.current !== undefined && !updateInProgress.current) {
      const valueToUpdate = updateQueue.current;
      updateQueue.current = undefined;
      
      logDebug('Processing queued update', { value: valueToUpdate });
      
      // Set the flag to prevent concurrent updates
      updateInProgress.current = true;
      
      // Update the value
      setValue(valueToUpdate);
      lastManualValue.current = valueToUpdate;
      manuallyUpdated.current = true;
      
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      if (valueToUpdate === undefined || valueToUpdate === '') {
        params.delete(key);
      } else {
        params.set(key, valueToUpdate);
      }

      const newUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newUrl);
      
      // Reset the flag after a delay to allow the URL update to complete
      setTimeout(() => {
        updateInProgress.current = false;
        
        // Check if there are more updates in the queue
        if (updateQueue.current !== undefined) {
          processUpdateQueue();
        }
      }, 100);
    }
  }, [router, searchParams, key]);

  useEffect(() => {
    const newValue = searchParams.get(key) || defaultValue;
    
    // Throttle URL-based updates to prevent rapid changes
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    
    if (timeSinceLastUpdate < 300) {
      logDebug('Throttling URL update, too soon after last update', { 
        timeSinceLastUpdate,
        newValue 
      });
      return;
    }
    
    // Only update value from URL if it wasn't manually set
    if (newValue !== value && !manuallyUpdated.current && !updateInProgress.current) {
      logDebug('Updating from URL', { newValue, currentValue: value });
      setValue(newValue);
      lastUpdateTime.current = now;
    } else if (manuallyUpdated.current) {
      logDebug('Ignoring URL update because value was manually set', { 
        urlValue: newValue, 
        manualValue: lastManualValue.current 
      });
      manuallyUpdated.current = false; // Reset for next URL change
    }
  }, [searchParams, key, defaultValue, value]);

  const updateValue = useCallback((newValue: string | undefined) => {
    logDebug('Manual update requested', { from: value, to: newValue });
    
    // Don't update if the value hasn't changed
    if (newValue === value) {
      logDebug('Skipping update, value unchanged', { value });
      return;
    }
    
    // If an update is already in progress, queue this update
    if (updateInProgress.current) {
      logDebug('Update in progress, queueing this update', { value: newValue });
      updateQueue.current = newValue;
      return;
    }
    
    // Queue the update and process it
    updateQueue.current = newValue;
    processUpdateQueue();
  }, [value, processUpdateQueue]);

  return [value, updateValue];
}
