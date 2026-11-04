// Selfie verification review.

import api, { unwrap } from './axios.js';

// GET /admin/verifications?status=&sortBy=&sortDir=&q=&cursor=&limit=
export function listVerifications(params) {
  return unwrap(api.get('/admin/verifications', { params }));
}

// GET /admin/verifications/:verificationId
export function getVerification(verificationId) {
  return unwrap(api.get(`/admin/verifications/${encodeURIComponent(verificationId)}`));
}

// PATCH /admin/verifications/:verificationId { status: APPROVED|REJECTED, reason? }
export function reviewVerification(verificationId, body) {
  return unwrap(api.patch(`/admin/verifications/${encodeURIComponent(verificationId)}`, body));
}
