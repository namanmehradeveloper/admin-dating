// Match management: stats, analytics, config, fraud, reported matches, detail.

import api, { unwrap } from './axios.js';

export function getMatchStats(params) {
  return unwrap(api.get('/admin/matches/stats', { params }));
}

export function getMatchAnalytics(params) {
  return unwrap(api.get('/admin/matches/analytics', { params }));
}

export function listSuspiciousMatches() {
  return unwrap(api.get('/admin/matches/suspicious'));
}

export function listReportedMatches(params) {
  return unwrap(api.get('/admin/matches/reported', { params }));
}

export function getMatchConfig() {
  return unwrap(api.get('/admin/matches/config'));
}

export function updateMatchConfig(body) {
  return unwrap(api.patch('/admin/matches/config', body));
}

export function getMatch(matchId) {
  return unwrap(api.get(`/admin/matches/${encodeURIComponent(matchId)}`));
}

export function endMatch(matchId, body = { reason: 'MODERATION' }) {
  return unwrap(api.post(`/admin/matches/${encodeURIComponent(matchId)}/end`, body));
}

export function listMatches(params) {
  return unwrap(api.get('/admin/matches', { params }));
}
