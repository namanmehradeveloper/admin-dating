// Expanded analytics beyond the dashboard overview.

import api, { unwrap } from './axios.js';

export function getAnalytics(params) {
  return unwrap(api.get('/admin/analytics', { params }));
}
