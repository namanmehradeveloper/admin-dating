// Admin-editable app settings (ADMIN only).

import api, { unwrap } from './axios.js';

// GET /admin/settings -> { settings: [{ key, value, defaultValue, min, max, updatedAt }], system: {...} }
export function getSettings() {
  return unwrap(api.get('/admin/settings'));
}

// PATCH /admin/settings { [key]: number }
export function updateSettings(changes) {
  return unwrap(api.patch('/admin/settings', changes));
}
