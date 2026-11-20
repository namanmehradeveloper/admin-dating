// Loads a paginated API list for admin tables and drawers.
//
// Default `pages` mode uses offset pagination (?page=&limit=) so numbered pages, totals,
// and page-size changes work. `append` keeps cursor-based "Load more" for drawers.
// Changing `filters` or page size resets to page 1; empty filter values are not sent.
// In-flight responses from older generations are ignored to avoid races.
// Page-mode lists silently refresh the current page every 30s while the tab is visible.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors.js';
import { useAutoRefresh } from './useAutoRefresh.js';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;
/** @deprecated Prefer DEFAULT_PAGE_SIZE; kept for any external imports. */
export const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function cleanParams(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}

function readMeta(page, fallbackPage, fallbackSize) {
  const total = typeof page.total === 'number' ? page.total : null;
  const pageSize = typeof page.pageSize === 'number' ? page.pageSize : fallbackSize;
  const currentPage = typeof page.page === 'number' ? page.page : fallbackPage;
  const totalPages =
    typeof page.totalPages === 'number'
      ? page.totalPages
      : total != null
        ? Math.max(1, Math.ceil(total / pageSize) || 1)
        : null;
  return { total, pageSize, currentPage, totalPages, nextCursor: page.nextCursor ?? null };
}

export function usePaginatedList(fetchPage, filters = {}, options = {}) {
  const mode = options.mode === 'append' ? 'append' : 'pages';
  const poll = options.poll ?? mode === 'pages';
  const initialSize = PAGE_SIZE_OPTIONS.includes(options.pageSize) ? options.pageSize : DEFAULT_PAGE_SIZE;

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialSize);
  const [total, setTotal] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  const filterKey = JSON.stringify(cleanParams(filters));
  const generationRef = useRef(0);
  const pageIndexRef = useRef(0);
  const cursorStackRef = useRef([null]);
  const pageSizeRef = useRef(pageSize);
  const totalPagesRef = useRef(totalPages);
  pageIndexRef.current = pageIndex;
  cursorStackRef.current = cursorStack;
  pageSizeRef.current = pageSize;
  totalPagesRef.current = totalPages;

  const applyPageResult = useCallback((page, requestedPage, requestedSize, { append = false } = {}) => {
    const meta = readMeta(page, requestedPage, requestedSize);
    setItems((current) => (append ? [...current, ...page.items] : page.items));
    setNextCursor(meta.nextCursor);
    setTotal(meta.total);
    setTotalPages(meta.totalPages);
    if (meta.currentPage !== requestedPage && meta.totalPages != null) {
      setPageIndex(Math.max(0, meta.currentPage - 1));
    }
  }, []);

  // Initial load + filter / page-size / reload resets (pages mode starts at page 1).
  useEffect(() => {
    const generation = ++generationRef.current;
    setIsLoading(true);
    setError(null);

    const params = { ...JSON.parse(filterKey), limit: pageSize };
    if (mode === 'pages') params.page = 1;

    fetchPage(params)
      .then((page) => {
        if (generation !== generationRef.current) return;
        applyPageResult(page, 1, pageSize);
        setCursorStack([null]);
        setPageIndex(0);
      })
      .catch((loadError) => {
        if (generation === generationRef.current) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (generation === generationRef.current) setIsLoading(false);
      });
  }, [applyPageResult, fetchPage, filterKey, mode, pageSize, reloadCount]);

  const silentRefresh = useCallback(() => {
    if (mode !== 'pages') return;
    const generation = generationRef.current;
    const page = pageIndexRef.current + 1;
    const size = pageSizeRef.current;
    fetchPage({ ...JSON.parse(filterKey), limit: size, page })
      .then((result) => {
        if (generation !== generationRef.current) return;
        applyPageResult(result, page, size);
      })
      .catch(() => {
        // Keep the last good page; ErrorState retry still uses reload().
      });
  }, [applyPageResult, fetchPage, filterKey, mode]);

  useAutoRefresh(silentRefresh, { enabled: poll });

  const fetchOffsetPage = useCallback(
    async (targetPage, { append = false } = {}) => {
      const generation = ++generationRef.current;
      setIsLoadingMore(true);
      setError(null);
      try {
        const size = pageSizeRef.current;
        const result = await fetchPage({ ...JSON.parse(filterKey), limit: size, page: targetPage });
        if (generation !== generationRef.current) return;
        applyPageResult(result, targetPage, size, { append });
        setPageIndex(targetPage - 1);
        setCursorStack([null]);
      } catch (loadError) {
        if (generation === generationRef.current) setError(getErrorMessage(loadError));
      } finally {
        if (generation === generationRef.current) setIsLoadingMore(false);
      }
    },
    [applyPageResult, fetchPage, filterKey],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const generation = ++generationRef.current;
    setIsLoadingMore(true);
    try {
      const page = await fetchPage({ ...JSON.parse(filterKey), limit: pageSizeRef.current, cursor: nextCursor });
      if (generation !== generationRef.current) return;
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
      if (typeof page.total === 'number') setTotal(page.total);
      setPageIndex((index) => index + 1);
      setCursorStack((stack) => [...stack, nextCursor]);
    } catch (loadError) {
      if (generation === generationRef.current) setError(getErrorMessage(loadError));
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
    }
  }, [fetchPage, filterKey, nextCursor]);

  const goNext = useCallback(async () => {
    if (mode === 'pages') {
      if (totalPages != null && pageIndex + 1 >= totalPages) return;
      if (totalPages == null && !nextCursor && items.length < pageSize) return;
      await fetchOffsetPage(pageIndex + 2);
      return;
    }
    if (!nextCursor) return;
    const generation = ++generationRef.current;
    setIsLoadingMore(true);
    setError(null);
    try {
      const page = await fetchPage({ ...JSON.parse(filterKey), limit: pageSizeRef.current, cursor: nextCursor });
      if (generation !== generationRef.current) return;
      setItems(page.items);
      setCursorStack((stack) => [...stack, nextCursor]);
      setPageIndex((index) => index + 1);
      setNextCursor(page.nextCursor);
      if (typeof page.total === 'number') setTotal(page.total);
    } catch (loadError) {
      if (generation === generationRef.current) setError(getErrorMessage(loadError));
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
    }
  }, [fetchOffsetPage, fetchPage, filterKey, items.length, mode, nextCursor, pageIndex, pageSize, totalPages]);

  const goPrev = useCallback(async () => {
    if (mode === 'pages') {
      if (pageIndex <= 0) return;
      await fetchOffsetPage(pageIndex);
      return;
    }
    if (pageIndex <= 0) return;
    const prevIndex = pageIndex - 1;
    const cursor = cursorStack[prevIndex];
    const generation = ++generationRef.current;
    setIsLoadingMore(true);
    setError(null);
    try {
      const params = { ...JSON.parse(filterKey), limit: pageSizeRef.current };
      if (cursor) params.cursor = cursor;
      const page = await fetchPage(params);
      if (generation !== generationRef.current) return;
      setItems(page.items);
      setPageIndex(prevIndex);
      setCursorStack((stack) => stack.slice(0, prevIndex + 1));
      setNextCursor(page.nextCursor);
      if (typeof page.total === 'number') setTotal(page.total);
    } catch (loadError) {
      if (generation === generationRef.current) setError(getErrorMessage(loadError));
    } finally {
      if (generation === generationRef.current) setIsLoadingMore(false);
    }
  }, [cursorStack, fetchOffsetPage, fetchPage, filterKey, mode, pageIndex]);

  const goToPage = useCallback(
    async (targetPage) => {
      if (mode !== 'pages') return;
      const safe = Math.max(1, Number(targetPage) || 1);
      if (totalPages != null && safe > totalPages) return;
      if (safe === pageIndex + 1) return;
      await fetchOffsetPage(safe);
    },
    [fetchOffsetPage, mode, pageIndex, totalPages],
  );

  const goFirst = useCallback(async () => {
    if (pageIndex <= 0) return;
    await goToPage(1);
  }, [goToPage, pageIndex]);

  const goLast = useCallback(async () => {
    const last = totalPagesRef.current;
    if (!last || pageIndex + 1 >= last) return;
    await goToPage(last);
  }, [goToPage, pageIndex]);

  const setPageSize = useCallback((nextSize) => {
    const size = Number(nextSize);
    if (!PAGE_SIZE_OPTIONS.includes(size) || size === pageSizeRef.current) return;
    setPageSizeState(size);
  }, []);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const hasMore =
    mode === 'pages'
      ? totalPages != null
        ? pageIndex + 1 < totalPages
        : Boolean(nextCursor) || items.length >= pageSize
      : Boolean(nextCursor);

  return {
    items,
    page: pageIndex + 1,
    pageSize,
    total,
    totalPages,
    hasMore,
    hasPrev: pageIndex > 0,
    error,
    isLoading,
    isLoadingMore,
    loadMore: mode === 'append' ? loadMore : goNext,
    goNext,
    goPrev,
    goToPage: mode === 'pages' ? goToPage : undefined,
    goFirst: mode === 'pages' ? goFirst : undefined,
    goLast: mode === 'pages' ? goLast : undefined,
    setPageSize: mode === 'pages' ? setPageSize : undefined,
    reload,
  };
}
