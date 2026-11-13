// Subscription overview, analytics and plans (ADMIN only).

import api, { unwrap } from './axios.js';

export function getSubscriptionStats() {
  return unwrap(api.get('/admin/subscriptions/stats'));
}

export function getSubscriptionAnalytics(params) {
  return unwrap(api.get('/admin/subscriptions/analytics', { params }));
}

export function listSubscriptionPlans() {
  return unwrap(api.get('/admin/subscriptions/plans'));
}

export function updateSubscriptionPlan(productId, body) {
  return unwrap(api.patch(`/admin/subscriptions/plans/${encodeURIComponent(productId)}`, body));
}

export function listSubscriptions(params) {
  return unwrap(api.get('/admin/subscriptions', { params }));
}

export function getSubscription(userId) {
  return unwrap(api.get(`/admin/subscriptions/${encodeURIComponent(userId)}`));
}
