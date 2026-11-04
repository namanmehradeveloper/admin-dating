// CMS content (staff read; ADMIN write).

import api, { unwrap } from './axios.js';

export function listCms(params) {
  return unwrap(api.get('/admin/cms', { params }));
}

export function getCms(id) {
  return unwrap(api.get(`/admin/cms/${encodeURIComponent(id)}`));
}

export function createCms(body) {
  return unwrap(api.post('/admin/cms', body));
}

export function updateCms(id, body) {
  return unwrap(api.patch(`/admin/cms/${encodeURIComponent(id)}`, body));
}
