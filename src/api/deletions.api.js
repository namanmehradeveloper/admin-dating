// Deletion Management ledger (read, retry, cancel, force purge). Scheduling stays on users.api.

import api, { unwrap } from './axios.js';

// GET /admin/deletion-management/stats
export function getDeletionStats() {
  return unwrap(api.get('/admin/deletion-management/stats'));
}

// GET /admin/deletion-management?tab=&q=&source=&cursor=&limit=
export function listDeletionRecords(params) {
  return unwrap(api.get('/admin/deletion-management', { params }));
}

// GET /admin/deletion-management/:recordId
export function getDeletionRecord(recordId) {
  return unwrap(api.get(`/admin/deletion-management/${encodeURIComponent(recordId)}`));
}

// POST /admin/deletion-management/:recordId/retry
export function retryDeletionRecord(recordId) {
  return unwrap(api.post(`/admin/deletion-management/${encodeURIComponent(recordId)}/retry`));
}

// POST /admin/deletion-management/:recordId/cancel
export function cancelDeletionRecord(recordId) {
  return unwrap(api.post(`/admin/deletion-management/${encodeURIComponent(recordId)}/cancel`));
}

// POST /admin/deletion-management/:recordId/purge — Super Admin; body must include { confirm: true }.
export function forcePurgeDeletionRecord(recordId, body = { confirm: true }) {
  return unwrap(api.post(`/admin/deletion-management/${encodeURIComponent(recordId)}/purge`, body));
}
