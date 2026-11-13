// Admin session state: who is signed in, login/logout, restoring after a reload, and staying in
// sync when another admin tab logs in, logs out, or rotates tokens.

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import * as authApi from '../api/auth.api.js';
import { isStaffRole } from '../utils/constants.js';
import { publishSessionEvent, subscribeSessionEvents } from '../utils/sessionSync.js';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../utils/tokenStorage.js';

export const AuthContext = createContext(null);

export class AccessDeniedError extends Error {
  constructor() {
    super('Access denied. This account is not a staff account.');
    this.name = 'AccessDeniedError';
  }
}

async function endServerSession() {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();
  clearTokens();
  if (refreshToken) await authApi.logout(refreshToken, accessToken).catch(() => {});
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(Boolean(getRefreshToken()));

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    navigate('/login', { replace: true, state: { reason: 'expired' } });
  }, [navigate]);

  useEffect(() => {
    api.setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  const refreshMe = useCallback(async () => {
    const me = await authApi.getMe();
    if (!isStaffRole(me.role)) {
      await endServerSession();
      setUser(null);
      publishSessionEvent('logout');
      throw new AccessDeniedError();
    }
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    if (!getRefreshToken()) {
      setIsRestoring(false);
      return;
    }
    refreshMe()
      .catch(() => clearTokens())
      .finally(() => setIsRestoring(false));
  }, [refreshMe]);

  // Other tabs: adopt a new login, or mirror logout / session expiry. Token rotation is handled by
  // the shared storage + axios lock; this tab only needs a profile when another tab signs in.
  useEffect(() => {
    return subscribeSessionEvents((message) => {
      if (message.type === 'logout' || message.type === 'session-expired') {
        clearTokens();
        setUser(null);
        setIsRestoring(false);
        navigate('/login', {
          replace: true,
          state: message.type === 'session-expired' ? { reason: 'expired' } : undefined,
        });
        return;
      }

      if (message.type === 'login') {
        if (!getRefreshToken()) return;
        setIsRestoring(true);
        refreshMe()
          .catch(() => {
            clearTokens();
            setUser(null);
          })
          .finally(() => setIsRestoring(false));
      }
    });
  }, [navigate, refreshMe]);

  const login = useCallback(
    async (email, password) => {
      const result = await authApi.login(email, password);
      if (!result?.tokens) {
        throw new Error('Sign-in failed. Please try again.');
      }
      saveTokens(result.tokens);
      if (!isStaffRole(result.user.role)) {
        await endServerSession();
        throw new AccessDeniedError();
      }
      const me = await refreshMe();
      publishSessionEvent('login');
      return me;
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    await endServerSession();
    publishSessionEvent('logout');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      isRestoring,
      isAuthenticated: Boolean(user),
      isAdmin: user?.isAdminTier || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      hasPermission: (module, action) => Boolean(user?.permissionKeys?.includes(`${module}.${action}`)),
      login,
      logout,
      refreshMe,
    }),
    [user, isRestoring, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
