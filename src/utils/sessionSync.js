// Cross-tab admin session coordination: exclusive refresh locks, token-change waits, and
// BroadcastChannel (+ localStorage fallback) so login/logout/expiry stay in sync across tabs.
// This is what makes shared localStorage safe with single-use rotating refresh tokens.

import { getAccessToken, subscribeTokens } from './tokenStorage.js';

const CHANNEL_NAME = 'dc_admin_session';
const LOCK_NAME = 'dc_admin_token_refresh';
const FALLBACK_LOCK_KEY = 'dc_admin_refresh_lock';
const EVENT_KEY = 'dc_admin_session_event';
const DEFAULT_LOCK_WAIT_MS = 10000;
const DEFAULT_TOKEN_WAIT_MS = 8000;

const listeners = new Set();
let channel = null;

function canUseBrowserApis() {
  return typeof window !== 'undefined';
}

function getChannel() {
  if (!canUseBrowserApis()) return null;
  if (channel) return channel;
  try {
    if (typeof BroadcastChannel === 'undefined') return null;
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => dispatch(event.data);
  } catch {
    channel = null;
  }
  return channel;
}

function dispatch(message) {
  if (!message || typeof message.type !== 'string') return;
  for (const listener of listeners) {
    try {
      listener(message);
    } catch {
      /* ignore */
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readFallbackLock() {
  try {
    const raw = globalThis.localStorage?.getItem(FALLBACK_LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeFallbackLock(value) {
  globalThis.localStorage.setItem(FALLBACK_LOCK_KEY, JSON.stringify(value));
}

function clearFallbackLock(owner) {
  try {
    const current = readFallbackLock();
    if (!current || current.owner === owner) {
      globalThis.localStorage.removeItem(FALLBACK_LOCK_KEY);
    }
  } catch {
    /* ignore */
  }
}

// Exclusive lock so only one tab calls /auth/token/refresh. Prefers Web Locks; falls back to a
// short-lived localStorage lock for older browsers / test environments.
export async function withRefreshLock(task, { waitMs = DEFAULT_LOCK_WAIT_MS } = {}) {
  const locks = globalThis.navigator?.locks;
  if (locks?.request) {
    return locks.request(LOCK_NAME, { mode: 'exclusive', ifAvailable: false }, async () => task());
  }

  if (!canUseBrowserApis() || !globalThis.localStorage) {
    return task();
  }

  const owner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deadline = Date.now() + waitMs;

  while (Date.now() < deadline) {
    const existing = readFallbackLock();
    if (!existing || existing.expiresAt < Date.now()) {
      try {
        writeFallbackLock({ owner, expiresAt: Date.now() + Math.min(8000, waitMs) });
      } catch {
        return task();
      }
      const claimed = readFallbackLock();
      if (claimed?.owner === owner) {
        try {
          return await task();
        } finally {
          clearFallbackLock(owner);
        }
      }
    }
    await sleep(40 + Math.random() * 60);
  }

  throw new Error('Could not acquire admin refresh lock');
}

// Resolves with a newer access token if another tab finishes rotation first.
export function waitForAccessTokenChange(failedAccessToken, { timeoutMs = DEFAULT_TOKEN_WAIT_MS } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const check = () => {
      const access = getAccessToken();
      if (access && access !== failedAccessToken) {
        finish(access);
        return;
      }
      if (Date.now() - started >= timeoutMs) finish(null);
    };

    const unsubscribeTokens = subscribeTokens(check);
    const unsubscribeEvents = subscribeSessionEvents((message) => {
      if (message.type === 'tokens-updated' || message.type === 'login') check();
      if (message.type === 'logout' || message.type === 'session-expired') finish(null);
    });
    const timer = setInterval(check, 50);

    function cleanup() {
      unsubscribeTokens();
      unsubscribeEvents();
      clearInterval(timer);
    }

    check();
  });
}

export function publishSessionEvent(type, detail = {}) {
  const message = { type, detail, at: Date.now() };
  // BroadcastChannel and the storage fallback notify *other* tabs only. The publishing tab
  // already updates its own React/axios state directly.
  getChannel()?.postMessage(message);
  if (canUseBrowserApis()) {
    try {
      globalThis.localStorage?.setItem(EVENT_KEY, JSON.stringify(message));
    } catch {
      /* ignore */
    }
  }
}

export function subscribeSessionEvents(listener) {
  listeners.add(listener);
  getChannel();

  const onStorage = (event) => {
    if (event.key !== EVENT_KEY || !event.newValue) return;
    try {
      dispatch(JSON.parse(event.newValue));
    } catch {
      /* ignore */
    }
  };

  if (canUseBrowserApis()) {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (canUseBrowserApis()) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function __resetSessionSyncForTests() {
  listeners.clear();
  try {
    channel?.close();
  } catch {
    /* ignore */
  }
  channel = null;
}
