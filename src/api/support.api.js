// Support desk.

import api, { unwrap } from './axios.js';

// GET /admin/support/tickets?status=&category=&cursor=&limit=
export function listTickets(params) {
  return unwrap(api.get('/admin/support/tickets', { params }));
}

// GET /admin/support/tickets/:ticketId
export function getTicket(ticketId) {
  return unwrap(api.get(`/admin/support/tickets/${encodeURIComponent(ticketId)}`));
}

// PATCH /admin/support/tickets/:ticketId { status }
export function updateTicketStatus(ticketId, status) {
  return unwrap(api.patch(`/admin/support/tickets/${encodeURIComponent(ticketId)}`, { status }));
}

// POST /admin/support/tickets/:ticketId/messages { body }
export function replyToTicket(ticketId, body) {
  return unwrap(api.post(`/admin/support/tickets/${encodeURIComponent(ticketId)}/messages`, { body }));
}
