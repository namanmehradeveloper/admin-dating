import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForAccessTokenChange, withRefreshLock, __resetSessionSyncForTests } from './sessionSync.js';
import {
  __resetTokenStorageForTests,
  getAccessToken,
  saveTokens,
  clearTokens,
} from './tokenStorage.js';

afterEach(() => {
  __resetSessionSyncForTests();
  __resetTokenStorageForTests();
  clearTokens();
  vi.unstubAllGlobals();
});

describe('withRefreshLock', () => {
  it('runs the task when Web Locks are unavailable', async () => {
    vi.stubGlobal('navigator', {});
    const result = await withRefreshLock(async () => 'ok');
    expect(result).toBe('ok');
  });

  it('uses navigator.locks when available', async () => {
    const request = vi.fn(async (_name, _options, callback) => callback());
    vi.stubGlobal('navigator', { locks: { request } });
    const result = await withRefreshLock(async () => 42);
    expect(result).toBe(42);
    expect(request).toHaveBeenCalledWith('dc_admin_token_refresh', { mode: 'exclusive', ifAvailable: false }, expect.any(Function));
  });

  it('serializes overlapping fallback locks on localStorage', async () => {
    const store = new Map();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    });

    const order = [];
    const first = withRefreshLock(async () => {
      order.push('a-start');
      await new Promise((resolve) => setTimeout(resolve, 40));
      order.push('a-end');
      return 'a';
    });
    const second = withRefreshLock(async () => {
      order.push('b-start');
      order.push('b-end');
      return 'b';
    });

    await expect(Promise.all([first, second])).resolves.toEqual(['a', 'b']);
    expect(order).toEqual(['a-start', 'a-end', 'b-start', 'b-end']);
  });
});

describe('waitForAccessTokenChange', () => {
  it('resolves when tokens rotate', async () => {
    saveTokens({ accessToken: 'old', refreshToken: 'old-r' });
    const pending = waitForAccessTokenChange('old', { timeoutMs: 1000 });
    setTimeout(() => saveTokens({ accessToken: 'new', refreshToken: 'new-r' }), 20);
    await expect(pending).resolves.toBe('new');
    expect(getAccessToken()).toBe('new');
  });

  it('resolves null on timeout', async () => {
    saveTokens({ accessToken: 'old', refreshToken: 'old-r' });
    await expect(waitForAccessTokenChange('old', { timeoutMs: 80 })).resolves.toBeNull();
  });
});
