import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook with automatic periodic refresh and cleanup.
 *
 * @param fetcher Async function returning data promise
 * @param refreshInterval Interval in ms for periodic polling (optional)
 * @param enabled Whether fetching is enabled (defaults to true)
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  refreshInterval?: number,
  enabled: boolean = true
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(async (isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      let message = 'An unexpected error occurred';
      if (axios.isAxiosError(err)) {
        if (err.response?.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
          message = String((err.response.data as { detail: string }).detail);
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    executeFetch(false);
  }, [executeFetch]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    executeFetch(true);

    let intervalId: NodeJS.Timeout | number | undefined;
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(() => {
        if (isMounted) {
          executeFetch(false);
        }
      }, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [executeFetch, refreshInterval, enabled]);

  return { data, loading, error, refetch };
}

export default useApi;
