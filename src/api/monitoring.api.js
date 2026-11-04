// Live system health (ADMIN only).

import api, { unwrap } from './axios.js';

export function getMonitoring() {
  return unwrap(api.get('/admin/monitoring'));
}
