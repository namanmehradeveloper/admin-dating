// Loads data from an API function and tracks loading and error state. The request runs again when
// any value in `dependencies` changes or when `reload` is called. By default the payload is also
// refreshed in the background every 30s while the tab is visible (`poll: false` for edit forms).

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors.js';
import { useAutoRefresh } from './useAutoRefresh.js';

export function useApi(fetcher, dependencies = [], options = {}) {
  const poll = options.poll !== false;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const fetcherRef = useRef(fetcher);
  const generationRef = useRef(0);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const generation = ++generationRef.current;
    setIsLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (generation !== generationRef.current) return;
        setData(result);
      })
      .catch((loadError) => {
        if (generation !== generationRef.current) return;
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (generation === generationRef.current) setIsLoading(false);
      });
  }, [...dependencies, reloadCount]);

  useAutoRefresh(() => {
    const generation = generationRef.current;
    fetcherRef
      .current()
      .then((result) => {
        if (generation !== generationRef.current) return;
        setData(result);
      })
      .catch(() => {
        // Keep the last good payload; ErrorState retry still uses reload().
      });
  }, { enabled: poll });

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { data, setData, error, isLoading, reload };
}
