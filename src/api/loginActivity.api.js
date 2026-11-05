import api, { unwrap } from './axios.js';

// GET /admin/login-activity?q=&fromDate=&toDate=&cursor=&limit=
export function listLoginActivity(params) {
  return unwrap(api.get('/admin/login-activity', { params }));
}
