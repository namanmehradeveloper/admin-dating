// Keeps the admin session tokens in sessionStorage: they survive a page reload but not closing the
// tab, and each tab has its own session (refresh tokens are single-use, so tabs must not share one).

const ACCESS_KEY = 'dc_admin_access_token';
const REFRESH_KEY = 'dc_admin_refresh_token';

// Returns sessionStorage, or a throwaway in-memory store where it is unavailable (tests, privacy modes).
function getStore() {
  try {
    return globalThis.sessionStorage ?? memoryStore;
  } catch {
    return memoryStore;
  }
}

const memoryValues = new Map();
const memoryStore = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => memoryValues.set(key, value),
  removeItem: (key) => memoryValues.delete(key),
};

export function getAccessToken() {
  return getStore().getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return getStore().getItem(REFRESH_KEY);
}

// Saves the { accessToken, refreshToken } pair returned by login and refresh.
export function saveTokens({ accessToken, refreshToken }) {
  getStore().setItem(ACCESS_KEY, accessToken);
  getStore().setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  getStore().removeItem(ACCESS_KEY);
  getStore().removeItem(REFRESH_KEY);
}
