// A/B experiment definitions (ADMIN only).

import api, { unwrap } from './axios.js';

export function listExperiments(params) {
  return unwrap(api.get('/admin/experiments', { params }));
}

export function getExperiment(id) {
  return unwrap(api.get(`/admin/experiments/${encodeURIComponent(id)}`));
}

export function createExperiment(body) {
  return unwrap(api.post('/admin/experiments', body));
}

export function updateExperiment(id, body) {
  return unwrap(api.patch(`/admin/experiments/${encodeURIComponent(id)}`, body));
}
