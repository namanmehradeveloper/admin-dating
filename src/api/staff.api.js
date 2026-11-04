// Staff accounts, roles/permissions matrix, sessions and force logout.

import api, { unwrap } from './axios.js';

export function getStaffStats() {
  return unwrap(api.get('/admin/staff/stats'));
}

export function listStaff(params) {
  return unwrap(api.get('/admin/staff', { params }));
}

export function getStaff(userId) {
  return unwrap(api.get(`/admin/staff/${encodeURIComponent(userId)}`));
}

export function createStaff(body) {
  return unwrap(api.post('/admin/staff', body));
}

export function updateStaffRole(userId, body) {
  return unwrap(api.patch(`/admin/staff/${encodeURIComponent(userId)}/role`, body));
}

export function updateStaffStatus(userId, body) {
  return unwrap(api.patch(`/admin/staff/${encodeURIComponent(userId)}/status`, body));
}

export function listStaffSessions(userId) {
  return unwrap(api.get(`/admin/staff/${encodeURIComponent(userId)}/sessions`));
}

export function forceStaffLogout(userId, body) {
  return unwrap(api.post(`/admin/staff/${encodeURIComponent(userId)}/force-logout`, body));
}

export function listStaffActivity(userId, params) {
  return unwrap(api.get(`/admin/staff/${encodeURIComponent(userId)}/activity`, { params }));
}

export function getRoleStats() {
  return unwrap(api.get('/admin/roles/stats'));
}

export function getPermissionCatalog() {
  return unwrap(api.get('/admin/roles/catalog'));
}

export function listRoles() {
  return unwrap(api.get('/admin/roles'));
}

export function getRole(roleId) {
  return unwrap(api.get(`/admin/roles/${encodeURIComponent(roleId)}`));
}

export function createRole(body) {
  return unwrap(api.post('/admin/roles', body));
}

export function updateRole(roleId, body) {
  return unwrap(api.patch(`/admin/roles/${encodeURIComponent(roleId)}`, body));
}

export function updateRolePermissions(roleId, body) {
  return unwrap(api.put(`/admin/roles/${encodeURIComponent(roleId)}/permissions`, body));
}

export function deleteRole(roleId, body) {
  return unwrap(api.delete(`/admin/roles/${encodeURIComponent(roleId)}`, { data: body ?? {} }));
}
