// Payment ledger and provider status (ADMIN only).

import api, { unwrap } from './axios.js';

export function getPaymentsStatus() {
  return unwrap(api.get('/admin/payments/status'));
}

export function getPaymentsStats(params) {
  return unwrap(api.get('/admin/payments/stats', { params }));
}

export function listPayments(params) {
  return unwrap(api.get('/admin/payments', { params }));
}

export function getPayment(paymentId) {
  return unwrap(api.get(`/admin/payments/${encodeURIComponent(paymentId)}`));
}
