// Honest status for capabilities that need external providers.

import api, { unwrap } from './axios.js';

export function getCallsStatus() {
  return unwrap(api.get('/admin/calls/status'));
}

export function getPaymentsStatus() {
  return unwrap(api.get('/admin/payments/status'));
}
