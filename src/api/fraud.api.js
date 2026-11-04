// Rule-based fraud signals (no invented AI provider).

import api, { unwrap } from './axios.js';

export function getFraudStatus() {
  return unwrap(api.get('/admin/fraud/status'));
}

export function listFraudSignals(params) {
  return unwrap(api.get('/admin/fraud/signals', { params }));
}

export function scanFraudUser(userId) {
  return unwrap(api.post(`/admin/fraud/scan/${encodeURIComponent(userId)}`));
}

export function updateFraudSignal(id, body) {
  return unwrap(api.patch(`/admin/fraud/signals/${encodeURIComponent(id)}`, body));
}
