// The one HTTP client of the admin panel. It calls the Express API directly at VITE_API_URL,
// attaches the access token, and on a 401 refreshes the session once and retries the request.
// Parallel 401s share a single refresh (refresh tokens are single-use). When the refresh fails the
// session is cleared and the app is sent back to the login page.

import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../utils/tokenStorage.js';

const AUTH_PATHS_WITHOUT_RETRY = ['/auth/login', '/auth/token/refresh', '/auth/logout'];

// Builds an API client. `storage` and `adapter` are injectable so the refresh logic can be tested.
export function createApiClient({ baseURL, storage = { getAccessToken, getRefreshToken, saveTokens, clearTokens }, adapter } = {}) {
  const client = axios.create({ baseURL, adapter, timeout: 20000 });
  const refreshClient = axios.create({ baseURL, adapter, timeout: 20000 });
  let refreshInFlight = null;
  let onSessionExpired = () => {};

  // Exchanges the stored refresh token for a new pair. Concurrent callers get the same promise.
  function refreshSession() {
    if (!refreshInFlight) {
      const refreshToken = storage.getRefreshToken();
      refreshInFlight = (refreshToken ? refreshClient.post('/auth/token/refresh', { refreshToken }) : Promise.reject(new Error('No refresh token')))
        .then((response) => {
          storage.saveTokens(response.data.data);
          return response.data.data.accessToken;
        })
        .finally(() => {
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
      let accessToken;
      try {
        accessToken = await refreshSession();
      } catch {
        storage.clearTokens();
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
