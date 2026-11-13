// Admin session tokens live in localStorage so every tab of the admin origin can share one
// session. Refresh-token rotation stays safe because axios acquires a cross-tab refresh lock
// before calling /auth/token/refresh (see sessionSync.js) — tabs never race the same single-use
// refresh token. sessionStorage is only read once to migrate older per-tab sessions.

const ACCESS_KEY = 'dc_admin_access_token';
const REFRESH_KEY = 'dc_admin_refresh_token';

const memoryValues = new Map();
const memoryStore = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => memoryValues.set(key, value),
  removeItem: (key) => memoryValues.delete(key),
};

const listeners = new Set();
let migrated = false;

function getStore() {
  try {
    return globalThis.localStorage ?? memoryStore;
  } catch {
    return memoryStore;
  }
}

function getSessionStore() {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function migrateFromSessionStorage() {
  if (migrated) return;
  migrated = true;
  const local = getStore();
  const session = getSessionStore();
  if (!session || local === memoryStore) return;
  try {
    if (local.getItem(ACCESS_KEY) || local.getItem(REFRESH_KEY)) {
      session.removeItem(ACCESS_KEY);
      session.removeItem(REFRESH_KEY);
      return;
    }
    const accessToken = session.getItem(ACCESS_KEY);
    const refreshToken = session.getItem(REFRESH_KEY);
    if (accessToken && refreshToken) {
      local.setItem(ACCESS_KEY, accessToken);
      local.setItem(REFRESH_KEY, refreshToken);
    }
    session.removeItem(ACCESS_KEY);
    session.removeItem(REFRESH_KEY);
  } catch {
    /* privacy mode / quota — keep going with whatever store we have */
  }
}

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      /* listener errors must not break auth */
    }
  }
}

function ensureMigrated() {
  migrateFromSessionStorage();
}

export function getAccessToken() {
  ensureMigrated();
  return getStore().getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  ensureMigrated();
  return getStore().getItem(REFRESH_KEY);
}

// Saves the { accessToken, refreshToken } pair returned by login and refresh.
export function saveTokens({ accessToken, refreshToken }) {
  ensureMigrated();
  const store = getStore();
  store.setItem(ACCESS_KEY, accessToken);
  store.setItem(REFRESH_KEY, refreshToken);
  const session = getSessionStore();
  if (session) {
    session.removeItem(ACCESS_KEY);
    session.removeItem(REFRESH_KEY);
  }
  notify();
}

export function clearTokens() {
  ensureMigrated();
  const store = getStore();
  store.removeItem(ACCESS_KEY);
  store.removeItem(REFRESH_KEY);
  const session = getSessionStore();
  if (session) {
    session.removeItem(ACCESS_KEY);
    session.removeItem(REFRESH_KEY);
  }
  notify();
}

// Same-tab + storage-event subscribers (other tabs writing localStorage).
export function subscribeTokens(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function onStorage(event) {
  if (event.storageArea && event.storageArea !== globalThis.localStorage) return;
  if (event.key !== ACCESS_KEY && event.key !== REFRESH_KEY && event.key !== null) return;
  notify();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', onStorage);
}

// Test helper: reset migration flag and in-memory fallback between cases.
export function __resetTokenStorageForTests() {
  migrated = false;
  memoryValues.clear();
  listeners.clear();
}
