// Loads a cursor-paginated API list ({ items, nextCursor }).
// Default `pages` mode replaces the table on Prev/Next. `append` keeps "Load more" for drawers.
// Changing `filters` resets to the first page; empty filter values are not sent.
// Page-mode lists silently refresh the current page every 30s while the tab is visible.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors.js';
import { useAutoRefresh } from './useAutoRefresh.js';

export const PAGE_SIZE = 20;

// Removes empty values so the API only receives filters that are set.
function cleanParams(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}

export function usePaginatedList(fetchPage, filters = {}, options = {}) {
  const mode = options.mode === 'append' ? 'append' : 'pages';
  const poll = options.poll ?? mode === 'pages';
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const filterKey = JSON.stringify(cleanParams(filters));
  const generationRef = useRef(0);
  const pageIndexRef = useRef(0);
  const cursorStackRef = useRef([null]);
  pageIndexRef.current = pageIndex;
  cursorStackRef.current = cursorStack;

  useEffect(() => {
    const generation = ++generationRef.current;
    setIsLoading(true);
    setError(null);
    fetchPage({ ...JSON.parse(filterKey), limit: PAGE_SIZE })
      .then((page) => {
        if (generation !== generationRef.current) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setCursorStack([null]);
        setPageIndex(0);
      })
      .catch((loadError) => {
        if (generation === generationRef.current) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (generation === generationRef.current) setIsLoading(false);
      });
  }, [fetchPage, filterKey, reloadCount]);

  const silentRefresh = useCallback(() => {
    const generation = generationRef.current;
    const params = { ...JSON.parse(filterKey), limit: PAGE_SIZE };
    const cursor = cursorStackRef.current[pageIndexRef.current];
    if (cursor) params.cursor = cursor;
    fetchPage(params)
      .then((page) => {
        if (generation !== generationRef.current) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        // Keep the last good page; ErrorState retry still uses reload().
      });
  }, [fetchPage, filterKey]);

  useAutoRefresh(silentRefresh, { enabled: poll });

  // Appends the next page (drawers / activity feeds).
  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const generation = ++generationRef.current;
    setIsLoadingMore(true);
    try {
      const page = await fetchPage({ ...JSON.parse(filterKey), limit: PAGE_SIZE, cursor: nextCursor });
      if (generation !== generationRef.current) return;
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
      setPageIndex((index) => index + 1);
      setCursorStack((stack) => [...stack, nextCursor]);
    } catch (loadError) {
      if (generation === generationRef.current) setError(getErrorMessage(loadError));
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
    }
  }, [fetchPage, filterKey, nextCursor]);

  // Replaces the current page with the next cursor page.
  const goNext = useCallback(async () => {
    if (!nextCursor) return;
    const generation = ++generationRef.current;
    setIsLoadingMore(true);
    setError(null);
    try {
      const page = await fetchPage({ ...JSON.parse(filterKey), limit: PAGE_SIZE, cursor: nextCursor });
      if (generation !== generationRef.current) return;
      setItems(page.items);
      setCursorStack((stack) => [...stack, nextCursor]);
      setPageIndex((index) => index + 1);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      if (generation === generationRef.current) setError(getErrorMessage(loadError));
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
    }
  }, [fetchPage, filterKey, nextCursor]);

  // Re-fetches the previous page using the stored cursor stack.
  const goPrev = useCallback(async () => {
    if (pageIndex <= 0) return;
    const prevIndex = pageIndex - 1;
    const cursor = cursorStack[prevIndex];
    const generation = ++generationRef.current;
    setIsLoadingMore(true);
    setError(null);
    try {
      const params = { ...JSON.parse(filterKey), limit: PAGE_SIZE };
      if (cursor) params.cursor = cursor;
      const page = await fetchPage(params);
      if (generation !== generationRef.current) return;
      setItems(page.items);
      setPageIndex(prevIndex);
      setCursorStack((stack) => stack.slice(0, prevIndex + 1));
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      if (generation === generationRef.current) setError(getErrorMessage(loadError));
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
    }
  }, [cursorStack, fetchPage, filterKey, pageIndex]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    items,
    page: pageIndex + 1,
    pageSize: PAGE_SIZE,
    hasMore: Boolean(nextCursor),
    hasPrev: pageIndex > 0,
    error,
    isLoading,
    isLoadingMore,
    loadMore: mode === 'append' ? loadMore : goNext,
    goNext,
    goPrev,
    reload,
  };
}
