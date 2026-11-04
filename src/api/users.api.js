// Member management.

import api, { unwrap } from './axios.js';

// GET /admin/users/stats
export function getUserStats() {
  return unwrap(api.get('/admin/users/stats'));
}

// GET /admin/users?q=&status=&role=&verificationStatus=&online=&activity=&gender=&sortBy=&sortDir=&cursor=&limit=
export function listUsers(params) {
  return unwrap(api.get('/admin/users', { params }));
}

// POST /admin/users — create member by phone + profile fields
export function createUser(body) {
  return unwrap(api.post('/admin/users', body));
}

// GET /admin/users/:userId
export function getUser(userId) {
  return unwrap(api.get(`/admin/users/${encodeURIComponent(userId)}`));
}

// GET /admin/users/:userId/reports?direction=against|by
export function listUserReports(userId, params) {
  return unwrap(api.get(`/admin/users/${encodeURIComponent(userId)}/reports`, { params }));
}

// GET /admin/users/:userId/matches
export function listUserMatches(userId, params) {
  return unwrap(api.get(`/admin/users/${encodeURIComponent(userId)}/matches`, { params }));
}

// GET /admin/users/:userId/sessions
export function listUserSessions(userId, params) {
  return unwrap(api.get(`/admin/users/${encodeURIComponent(userId)}/sessions`, { params }));
}

// GET /admin/users/:userId/activity
export function listUserActivity(userId, params) {
  return unwrap(api.get(`/admin/users/${encodeURIComponent(userId)}/activity`, { params }));
}

// GET /admin/users/:userId/export (ADMIN)
export function exportUserData(userId) {
  return unwrap(api.get(`/admin/users/${encodeURIComponent(userId)}/export`));
}

// POST /admin/users/:userId/deletion { reason } (ADMIN)
export function scheduleUserDeletion(userId, body) {
  return unwrap(api.post(`/admin/users/${encodeURIComponent(userId)}/deletion`, body));
}

// PATCH /admin/users/:userId/status { status, reason, until? }
export function changeUserStatus(userId, body) {
  return unwrap(api.patch(`/admin/users/${encodeURIComponent(userId)}/status`, body));
}
