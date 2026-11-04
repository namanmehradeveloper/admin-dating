// Conversation / message metadata (no message bodies).

import api, { unwrap } from './axios.js';

export function getMessagingStats(params) {
  return unwrap(api.get('/admin/messaging/stats', { params }));
}

// GET /admin/messaging/conversations?status=&q=&cursor=&limit=
export function listConversations(params) {
  return unwrap(api.get('/admin/messaging/conversations', { params }));
}
