// Notification campaigns.

import api, { unwrap } from './axios.js';

// GET /admin/notifications?q=&cursor=&limit=
export function listCampaigns(params) {
  return unwrap(api.get('/admin/notifications', { params }));
}

// POST /admin/notifications { title, body, type, audience, targetUserId? } (ADMIN only)
export function sendCampaign(body) {
  return unwrap(api.post('/admin/notifications', body));
}
