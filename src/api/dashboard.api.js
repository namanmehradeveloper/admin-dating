// Dashboard counts.

import api, { unwrap } from './axios.js';

// GET /admin/dashboard?days=7|30|90 or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export function getDashboard(params = {}) {
  const query = typeof params === 'number' ? { days: params } : params;
  return unwrap(api.get('/admin/dashboard', { params: query }));
}
