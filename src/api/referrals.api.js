// Referral codes (ADMIN only).

import api, { unwrap } from './axios.js';

export function getReferralStats() {
  return unwrap(api.get('/admin/referrals/stats'));
}

export function listReferrals(params) {
  return unwrap(api.get('/admin/referrals', { params }));
}

export function createReferral(body) {
  return unwrap(api.post('/admin/referrals', body));
}

export function updateReferral(id, body) {
  return unwrap(api.patch(`/admin/referrals/${encodeURIComponent(id)}`, body));
}
