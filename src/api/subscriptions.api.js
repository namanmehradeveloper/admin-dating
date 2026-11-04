// Subscription overview (ADMIN only, read-only).

import api, { unwrap } from './axios.js';

// GET /admin/subscriptions?tier=&isActive=&cursor=&limit=
export function listSubscriptions(params) {
  return unwrap(api.get('/admin/subscriptions', { params }));
}

// GET /admin/subscriptions/:userId
export function getSubscription(userId) {
  return unwrap(api.get(`/admin/subscriptions/${encodeURIComponent(userId)}`));
}
