// Admin sign-in, sign-out and the current staff session.

import api, { unwrap } from './axios.js';

// POST /auth/login -> tokens for a staff email/password sign-in.
export function login(email, password) {
  return unwrap(api.post('/auth/login', { email, password }));
}

// POST /auth/logout — revokes the refresh token on the server. Needs the current access token.
export function logout(refreshToken, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
  return unwrap(api.post('/auth/logout', { refreshToken }, { headers }));
}

// GET /admin/me -> staff session with permissions.
export function getMe() {
  return unwrap(api.get('/admin/me'));
}
