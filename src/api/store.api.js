// Virtual store catalogue and wallets (ADMIN only).

import api, { unwrap } from './axios.js';

export function listStoreItems(params) {
  return unwrap(api.get('/admin/store/items', { params }));
}

export function createStoreItem(body) {
  return unwrap(api.post('/admin/store/items', body));
}

export function updateStoreItem(itemId, body) {
  return unwrap(api.patch(`/admin/store/items/${encodeURIComponent(itemId)}`, body));
}

export function listStorePurchases(params) {
  return unwrap(api.get('/admin/store/purchases', { params }));
}

export function getStoreWallet(userId) {
  return unwrap(api.get(`/admin/store/wallets/${encodeURIComponent(userId)}`));
}

export function adjustStoreWallet(userId, body) {
  return unwrap(api.post(`/admin/store/wallets/${encodeURIComponent(userId)}/adjust`, body));
}
