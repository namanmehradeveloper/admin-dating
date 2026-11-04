// Swipe & like management: stats, analytics, abuse, entitlements, member reports.

import api, { unwrap } from './axios.js';

export function getSwipeStats(params) {
  return unwrap(api.get('/admin/swipes/stats', { params }));
}

export function getSwipeAnalytics(params) {
  return unwrap(api.get('/admin/swipes/analytics', { params }));
}

export function listSwipeAbuse() {
  return unwrap(api.get('/admin/swipes/abuse'));
}

export function getSwipeEntitlements() {
  return unwrap(api.get('/admin/swipes/entitlements'));
}

export function updateSwipeEntitlements(body) {
  return unwrap(api.patch('/admin/swipes/entitlements', body));
}

export function getMemberSwipeReport(userId) {
  return unwrap(api.get(`/admin/swipes/members/${encodeURIComponent(userId)}/report`));
}

export function listSwipes(params) {
  return unwrap(api.get('/admin/swipes', { params }));
}
