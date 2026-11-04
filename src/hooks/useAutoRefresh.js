// Polls a callback on an interval while the tab is visible. Used by list and dashboard hooks
// so staff do not need a Refresh button.

import { useEffect, useRef } from 'react';

export const AUTO_REFRESH_MS = 30_000;

export function useAutoRefresh(callback, { enabled = true, interval = AUTO_REFRESH_MS } = {}) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    const run = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      callbackRef.current();
    };

    const id = window.setInterval(run, interval);
    const onVisibility = () => {
      if (!document.hidden) callbackRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, interval]);
}
