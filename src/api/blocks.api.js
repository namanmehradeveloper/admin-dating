// Block management: stats, analytics, velocity, member reports, detail.
// No silent admin unblock endpoint — member safety action only.

import api, { unwrap } from './axios.js';

export function getBlockStats(params) {
  return unwrap(api.get('/admin/blocks/stats', { params }));
}

export function getBlockAnalytics(params) {
  return unwrap(api.get('/admin/blocks/analytics', { params }));
}

export function listBlockVelocity() {
  return unwrap(api.get('/admin/blocks/velocity'));
}

export function getMemberBlockReport(userId) {
  return unwrap(api.get(`/admin/blocks/members/${encodeURIComponent(userId)}/report`));
}

export function getBlock(blockId) {
  return unwrap(api.get(`/admin/blocks/${encodeURIComponent(blockId)}`));
}

export function listBlocks(params) {
  return unwrap(api.get('/admin/blocks', { params }));
}
