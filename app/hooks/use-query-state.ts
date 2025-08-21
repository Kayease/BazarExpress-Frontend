import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function useQueryState(key: string, defaultValue?: string): [string | undefined, (value: string | undefined) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string | undefined>(() => searchParams.get(key) || defaultValue);

  useEffect(() => {
    const newValue = searchParams.get(key) || defaultValue;
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [searchParams, key, defaultValue, value]);

  const updateValue = useCallback((newValue: string | undefined) => {
    setValue(newValue);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newValue === undefined || newValue === '') {
      params.delete(key);
    } else {
      params.set(key, newValue);
    }

    const newUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl);
  }, [router, searchParams, key]);

  return [value, updateValue];
}