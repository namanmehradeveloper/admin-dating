// Honest status for capabilities that need external providers.

import api, { unwrap } from './axios.js';

export { getCallsStatus } from './calls.api.js';

export function getPaymentsStatus() {
  return unwrap(api.get('/admin/payments/status'));
}
