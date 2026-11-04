// Moderation queue.

import api, { unwrap } from './axios.js';

// GET /admin/reports?status=&targetType=&reason=&cursor=&limit=
export function listReports(params) {
  return unwrap(api.get('/admin/reports', { params }));
}

// GET /admin/reports/:reportId
export function getReport(reportId) {
  return unwrap(api.get(`/admin/reports/${encodeURIComponent(reportId)}`));
}

// PATCH /admin/reports/:reportId { status?, resolutionNote?, assignToMe? }
export function updateReport(reportId, body) {
  return unwrap(api.patch(`/admin/reports/${encodeURIComponent(reportId)}`, body));
}
