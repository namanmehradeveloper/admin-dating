import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __resetTokenStorageForTests,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  subscribeTokens,
} from './tokenStorage.js';

function memoryLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

afterEach(() => {
  __resetTokenStorageForTests();
  vi.unstubAllGlobals();
});

describe('tokenStorage', () => {
  it('persists and clears tokens', () => {
    saveTokens({ accessToken: 'a', refreshToken: 'r' });
    expect(getAccessToken()).toBe('a');
    expect(getRefreshToken()).toBe('r');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('notifies subscribers on save and clear', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTokens(listener);
    saveTokens({ accessToken: 'a', refreshToken: 'r' });
    clearTokens();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('migrates a legacy sessionStorage session into localStorage once', () => {
    const local = memoryLocalStorage();
    const session = memoryLocalStorage();
    session.setItem('dc_admin_access_token', 'legacy-access');
    session.setItem('dc_admin_refresh_token', 'legacy-refresh');

    vi.stubGlobal('localStorage', local);
    vi.stubGlobal('sessionStorage', session);
    vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });

    __resetTokenStorageForTests();

    expect(getAccessToken()).toBe('legacy-access');
    expect(getRefreshToken()).toBe('legacy-refresh');
    expect(local.getItem('dc_admin_access_token')).toBe('legacy-access');
    expect(session.getItem('dc_admin_access_token')).toBeNull();
  });
});
