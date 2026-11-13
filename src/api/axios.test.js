// Tests the HTTP client's session handling with a fake axios adapter: the Bearer header, one
// shared refresh for parallel 401s, a single retry, sign-out when the refresh fails, and
// cross-tab safe refresh (lock + adopt already-rotated tokens).

import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './axios.js';

// In-memory token storage with the same interface as utils/tokenStorage.js.
function createStorage(tokens = { accessToken: 'old-access', refreshToken: 'old-refresh' }) {
  let current = { ...tokens };
  const listeners = new Set();
  return {
    getAccessToken: () => current.accessToken ?? null,
    getRefreshToken: () => current.refreshToken ?? null,
    saveTokens: (next) => {
      current = { accessToken: next.accessToken, refreshToken: next.refreshToken };
      for (const listener of listeners) listener();
    },
    clearTokens: () => {
      current = {};
      for (const listener of listeners) listener();
    },
    snapshot: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
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
      return config.headers.Authorization === 'Bearer new-access'
        ? respond(config, 200, { data: config.url })
        : respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
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
      if (config.url === '/auth/token/refresh') {
        return respond(config, 200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      }
      return respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });
    const client = createApiClient({ baseURL: 'http://api.test', storage: createStorage(), adapter });

    await expect(client.get('/admin/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(adapter.mock.calls.filter(([config]) => config.url === '/admin/me')).toHaveLength(2);
  });

  it('clears the session and reports expiry when the refresh fails', async () => {
    const adapter = vi.fn((config) => respond(config, 401, { error: { code: 'UNAUTHENTICATED' } }));
    const storage = createStorage();
    const publish = vi.fn();
    const client = createApiClient({
      baseURL: 'http://api.test',
      storage,
      adapter,
      publish,
      waitForToken: async () => null,
    });
    const onExpired = vi.fn();
    client.setSessionExpiredHandler(onExpired);

    await expect(client.get('/admin/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('session-expired');
    expect(storage.snapshot()).toEqual({});
  });

  it('never refreshes for a failed login', async () => {
    const adapter = vi.fn((config) => respond(config, 401, { error: { code: 'UNAUTHENTICATED' } }));
    const client = createApiClient({ baseURL: 'http://api.test', storage: createStorage(), adapter });

    await expect(client.post('/auth/login', { email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('uses the refresh lock and publishes tokens-updated after rotation', async () => {
    let refreshCalls = 0;
    let lockCalls = 0;
    const adapter = vi.fn((config) => {
      if (config.url === '/auth/token/refresh') {
        refreshCalls += 1;
        return respond(config, 200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      }
      return config.headers.Authorization === 'Bearer new-access'
        ? respond(config, 200, { data: 'ok' })
        : respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });
    const publish = vi.fn();
    const withLock = vi.fn(async (task) => {
      lockCalls += 1;
      return task();
    });
    const client = createApiClient({
      baseURL: 'http://api.test',
      storage: createStorage(),
      adapter,
      withLock,
      publish,
    });

    await client.get('/admin/me');
    expect(refreshCalls).toBe(1);
    expect(lockCalls).toBe(1);
    expect(publish).toHaveBeenCalledWith('tokens-updated');
  });

  it('adopts tokens already rotated by another tab instead of refreshing again', async () => {
    const storage = createStorage();
    let refreshCalls = 0;
    const adapter = vi.fn((config) => {
      if (config.url === '/auth/token/refresh') {
        refreshCalls += 1;
        return respond(config, 200, { data: { accessToken: 'should-not-use', refreshToken: 'should-not-use' } });
      }
      return config.headers.Authorization === 'Bearer other-tab-access'
        ? respond(config, 200, { data: 'ok' })
        : respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });

    const withLock = vi.fn(async (task) => {
      // Simulate another tab finishing rotation while we waited for the lock.
      storage.saveTokens({ accessToken: 'other-tab-access', refreshToken: 'other-tab-refresh' });
      return task();
    });

    const client = createApiClient({
      baseURL: 'http://api.test',
      storage,
      adapter,
      withLock,
      publish: vi.fn(),
    });

    const response = await client.get('/admin/me');
    expect(response.data.data).toBe('ok');
    expect(refreshCalls).toBe(0);
    expect(storage.snapshot()).toEqual({
      accessToken: 'other-tab-access',
      refreshToken: 'other-tab-refresh',
    });
  });

  it('waits for another tab when the lock cannot be acquired', async () => {
    const storage = createStorage();
    const adapter = vi.fn((config) => {
      if (config.url === '/auth/token/refresh') {
        throw new Error('refresh must not run');
      }
      return config.headers.Authorization === 'Bearer peer-access'
        ? respond(config, 200, { data: 'ok' })
        : respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });

    const client = createApiClient({
      baseURL: 'http://api.test',
      storage,
      adapter,
      withLock: async () => {
        throw new Error('Could not acquire admin refresh lock');
      },
      waitForToken: async () => {
        storage.saveTokens({ accessToken: 'peer-access', refreshToken: 'peer-refresh' });
        return 'peer-access';
      },
      publish: vi.fn(),
    });

    const response = await client.get('/admin/me');
    expect(response.data.data).toBe('ok');
    expect(storage.snapshot().accessToken).toBe('peer-access');
  });

  it('simulates two tab clients sharing storage with only one refresh', async () => {
    const storage = createStorage();
    let refreshCalls = 0;
    let refreshGate = null;
    const refreshStarted = new Promise((resolve) => {
      refreshGate = resolve;
    });

    const adapter = vi.fn(async (config) => {
      if (config.url === '/auth/token/refresh') {
        refreshCalls += 1;
        refreshGate();
        await new Promise((resolve) => setTimeout(resolve, 30));
        return respond(config, 200, { data: { accessToken: 'shared-access', refreshToken: 'shared-refresh' } });
      }
      return config.headers.Authorization === 'Bearer shared-access'
        ? respond(config, 200, { data: config.url })
        : respond(config, 401, { error: { code: 'UNAUTHENTICATED' } });
    });

    let lockHolder = Promise.resolve();
    const withLock = async (task) => {
      const previous = lockHolder;
      let release;
      lockHolder = new Promise((resolve) => {
        release = resolve;
      });
      await previous;
      try {
        return await task();
      } finally {
        release();
      }
    };

    const tabA = createApiClient({ baseURL: 'http://api.test', storage, adapter, withLock, publish: vi.fn() });
    const tabB = createApiClient({ baseURL: 'http://api.test', storage, adapter, withLock, publish: vi.fn() });

    const requestA = tabA.get('/admin/me');
    await refreshStarted;
    const requestB = tabB.get('/admin/dashboard');

    const [a, b] = await Promise.all([requestA, requestB]);
    expect(a.data.data).toBe('/admin/me');
    expect(b.data.data).toBe('/admin/dashboard');
    expect(refreshCalls).toBe(1);
    expect(storage.snapshot()).toEqual({ accessToken: 'shared-access', refreshToken: 'shared-refresh' });
  });
});
