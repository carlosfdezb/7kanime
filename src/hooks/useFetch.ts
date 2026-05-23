import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, ApiError } from '../api/client';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string | null): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({ ...prev, loading: true, error: null }));

    apiFetch<T>(url, controller.signal)
      .then(data => {
        // Check if component is still mounted and request is not stale
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          if (error instanceof ApiError) {
            setState({ data: null, loading: false, error: error.message });
          } else if (error.name === 'AbortError') {
            // Request was cancelled, ignore
            setState(prev => prev);
          } else {
            setState({ data: null, loading: false, error: 'Sin conexión' });
          }
        }
      });

    return () => {
      controller.abort();
    };
  }, [url]);

  return state;
}

export function useFetchRetry<T>(url: string | null, _retries = 3): FetchState<T> & { retry: () => void } {
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount(c => c + 1);
  }, []);

  // Re-trigger fetch when retryCount changes
  const [retryUrl, setRetryUrl] = useState(url);

  useEffect(() => {
    setRetryUrl(url);
  }, [url]);

  const currentUrl = (() => {
    if (!retryUrl) return null;
    if (retryCount === 0) return retryUrl;
    const url = new URL(retryUrl, window.location.origin);
    url.searchParams.set('retry', String(retryCount));
    return url.toString();
  })();

  const result = useFetch<T>(currentUrl);

  return {
    ...result,
    retry,
  };
}
