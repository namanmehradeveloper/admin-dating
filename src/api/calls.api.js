// Admin call ops (metadata only — no media / Agora tokens).

import api, { unwrap } from './axios.js';

export function getCallsStatus() {
  return unwrap(api.get('/admin/calls/status'));
}

export function getCallsStats(params) {
  return unwrap(api.get('/admin/calls/stats', { params }));
}

// GET /admin/calls?type=&status=&q=&cursor=&limit=
export function listCalls(params) {
  return unwrap(api.get('/admin/calls', { params }));
}

export function getCall(callId) {
  return unwrap(api.get(`/admin/calls/${callId}`));
}
