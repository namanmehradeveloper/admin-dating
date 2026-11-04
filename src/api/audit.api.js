// Audit trail (ADMIN only, read-only).

import api, { unwrap } from './axios.js';

// GET /admin/audit-logs?actorId=&targetId=&action=&targetType=&cursor=&limit=
export function listAuditLogs(params) {
  return unwrap(api.get('/admin/audit-logs', { params }));
}

// GET /admin/audit-logs/:auditLogId
export function getAuditLog(auditLogId) {
  return unwrap(api.get(`/admin/audit-logs/${encodeURIComponent(auditLogId)}`));
}
