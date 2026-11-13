// The one HTTP client of the admin panel. It calls the Express API directly at VITE_API_URL,
// attaches the access token, and on a 401 refreshes the session once and retries the request.
// Parallel 401s in one tab share a single refresh promise. Across tabs, sessionSync's exclusive
// lock + "token already rotated" check prevent two tabs from burning the same single-use refresh
// token. When the refresh fails the session is cleared, other tabs are notified, and the app is
// sent back to the login page.

import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../utils/tokenStorage.js';
import { publishSessionEvent, waitForAccessTokenChange, withRefreshLock } from '../utils/sessionSync.js';

const AUTH_PATHS_WITHOUT_RETRY = ['/auth/login', '/auth/token/refresh', '/auth/logout'];

function readFailedAccessToken(config, storage) {
  const header = config?.headers?.Authorization ?? config?.headers?.authorization;
  if (typeof header === 'string') {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1];
  }
  return storage.getAccessToken();
}

// Builds an API client. `storage`, `adapter`, and lock helpers are injectable for tests.
export function createApiClient({
  baseURL,
  storage = { getAccessToken, getRefreshToken, saveTokens, clearTokens },
  adapter,
  withLock = withRefreshLock,
  waitForToken = waitForAccessTokenChange,
  publish = publishSessionEvent,
} = {}) {
  const client = axios.create({ baseURL, adapter, timeout: 20000 });
  const refreshClient = axios.create({ baseURL, adapter, timeout: 20000 });
  let refreshInFlight = null;
  let onSessionExpired = () => {};

  // Exchanges the stored refresh token for a new pair under a cross-tab lock. Concurrent callers
  // in this tab await the same promise; other tabs either wait on the lock or adopt rotated tokens.
  function refreshSession(failedAccessToken) {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const existing = storage.getAccessToken();
        if (existing && failedAccessToken && existing !== failedAccessToken) {
          return existing;
        }

        try {
          return await withLock(async () => {
            const access = storage.getAccessToken();
            if (access && failedAccessToken && access !== failedAccessToken) {
              return access;
            }

            const refreshToken = storage.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');

            const response = await refreshClient.post('/auth/token/refresh', { refreshToken });
            const tokens = response.data.data;
            storage.saveTokens(tokens);
            publish('tokens-updated');
            return tokens.accessToken;
          });
        } catch (error) {
          const adopted = await waitForToken(failedAccessToken);
          if (adopted) return adopted;
          throw error;
        }
      })().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  client.interceptors.request.use((config) => {
    const token = storage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const isUnauthenticated = error.response?.status === 401;
      const isAuthCall = AUTH_PATHS_WITHOUT_RETRY.some((path) => original?.url?.startsWith(path));
      if (!isUnauthenticated || !original || original._retried || isAuthCall) throw error;

      original._retried = true;
      const failedAccessToken = readFailedAccessToken(original, storage);
      let accessToken;
      try {
        accessToken = await refreshSession(failedAccessToken);
      } catch {
        storage.clearTokens();
        publish('session-expired');
        onSessionExpired();
        throw error;
      }
      original.headers.Authorization = `Bearer ${accessToken}`;
      return client(original);
    },
  );

  // Lets AuthContext react when the session can no longer be refreshed.
  client.setSessionExpiredHandler = (handler) => {
    onSessionExpired = handler;
  };
  return client;
}

const api = createApiClient({ baseURL: import.meta.env.VITE_API_URL });

// Returns the `data` field of the API envelope { data, meta }.
export async function unwrap(request) {
  const response = await request;
  return response.data.data;
}

export default api;
