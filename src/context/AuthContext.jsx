// Admin session state: who is signed in, login/logout, and restoring the session after a reload.

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import * as authApi from '../api/auth.api.js';
import { isStaffRole } from '../utils/constants.js';
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
      throw new AccessDeniedError();
    }
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    if (!getRefreshToken()) return;
    refreshMe()
      .catch(() => clearTokens())
      .finally(() => setIsRestoring(false));
  }, [refreshMe]);

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
      return refreshMe();
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    await endServerSession();
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
