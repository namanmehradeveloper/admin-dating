// Tests the HTTP client's session handling with a fake axios adapter: the Bearer header, one
// shared refresh for parallel 401s, a single retry, and sign-out when the refresh fails.

import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './axios.js';

// In-memory token storage with the same interface as utils/tokenStorage.js.
function createStorage(tokens = { accessToken: 'old-access', refreshToken: 'old-refresh' }) {
  let current = { ...tokens };
  return {
    getAccessToken: () => current.accessToken,
    getRefreshToken: () => current.refreshToken,
    saveTokens: (next) => {
      current = { accessToken: next.accessToken, refreshToken: next.refreshToken };
    },
    clearTokens: () => {
      current = {};
    },
    snapshot: () => current,
  };
}

// Builds an axios response or rejects like axios does for non-2xx statuses.
function respond(config, status, data) {
  const response = { status, data, headers: {}, config, statusText: String(status) };
  if (status >= 200 && status < 300) return Promise.resolve(response);
  const error = new Error(`Request failed with status ${status}`);
  Object.assign(error, { config, response, isAxiosError: true });
  return Promise.reject(error);
}

describe('API client session handling', () => {
  it('attaches the access token', async () => {
    const adapter = vi.fn((config) => respond(config, 200, { data: config.headers.Authorization }));
    const client = createApiClient({ baseURL: 'http://api.test', storage: createStorage(), adapter });
    const response = await client.get('/admin/me');
    expect(response.data.data).toBe('Bearer old-access');
  });

  it('refreshes once for parallel 401s and retries each request with the new token', async () => {
    let refreshCalls = 0;
    const adapter = vi.fn((config) => {
      if (config.url === '/auth/token/refresh') {
        refreshCalls += 1;
        return respond(config, 200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 900 } });
      }
      return config.headers.Authorization === 'Bearer new-access' ? respond(config, 200, { data: config.url }) : respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });
    const storage = createStorage();
    const client = createApiClient({ baseURL: 'http://api.test', storage, adapter });

    const results = await Promise.all([client.get('/admin/me'), client.get('/admin/dashboard'), client.get('/admin/users')]);
    expect(results.map((response) => response.data.data)).toEqual(['/admin/me', '/admin/dashboard', '/admin/users']);
    expect(refreshCalls).toBe(1);
    expect(storage.snapshot()).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });

  it('retries only once when the retried request is still 401', async () => {
    const adapter = vi.fn((config) => {
      if (config.url === '/auth/token/refresh') return respond(config, 200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      return respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });
    const client = createApiClient({ baseURL: 'http://api.test', storage: createStorage(), adapter });

    await expect(client.get('/admin/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(adapter.mock.calls.filter(([config]) => config.url === '/admin/me')).toHaveLength(2);
  });

  it('clears the session and reports expiry when the refresh fails', async () => {
    const adapter = vi.fn((config) => respond(config, 401, { error: { code: 'UNAUTHENTICATED' } }));
    const storage = createStorage();
    const client = createApiClient({ baseURL: 'http://api.test', storage, adapter });
    const onExpired = vi.fn();
    client.setSessionExpiredHandler(onExpired);

    await expect(client.get('/admin/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(storage.snapshot()).toEqual({});
  });

  it('never refreshes for a failed login', async () => {
    const adapter = vi.fn((config) => respond(config, 401, { error: { code: 'UNAUTHENTICATED' } }));
    const client = createApiClient({ baseURL: 'http://api.test', storage: createStorage(), adapter });

    await expect(client.post('/auth/login', { email: 'a@b.c', password: 'x' })).rejects.toMatchObject({ response: { status: 401 } });
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
