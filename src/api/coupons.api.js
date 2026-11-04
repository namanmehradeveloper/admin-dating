// Promo coupons (ADMIN only).

import api, { unwrap } from './axios.js';

export function getCouponStats() {
  return unwrap(api.get('/admin/coupons/stats'));
}

export function listCoupons(params) {
  return unwrap(api.get('/admin/coupons', { params }));
}

export function createCoupon(body) {
  return unwrap(api.post('/admin/coupons', body));
}

export function updateCoupon(id, body) {
  return unwrap(api.patch(`/admin/coupons/${encodeURIComponent(id)}`, body));
}
