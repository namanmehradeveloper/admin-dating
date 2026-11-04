// Admin profile management: list, stats, detail, edits, visibility, boost, privacy, photo moderation.

import api, { unwrap } from './axios.js';

export function getProfileStats() {
  return unwrap(api.get('/admin/profiles/stats'));
}

export function listProfiles(params) {
  return unwrap(api.get('/admin/profiles', { params }));
}

export function listPhotoQueue(params) {
  return unwrap(api.get('/admin/profiles/photo-queue', { params }));
}

export function getProfile(userId) {
  return unwrap(api.get(`/admin/profiles/${encodeURIComponent(userId)}`));
}

export function getProfileHistory(userId, params) {
  return unwrap(api.get(`/admin/profiles/${encodeURIComponent(userId)}/history`, { params }));
}

export function updateProfile(userId, body) {
  return unwrap(api.patch(`/admin/profiles/${encodeURIComponent(userId)}`, body));
}

export function updateProfileAccount(userId, body) {
  return unwrap(api.patch(`/admin/profiles/${encodeURIComponent(userId)}/account`, body));
}

export function updateProfileVisibility(userId, body) {
  return unwrap(api.patch(`/admin/profiles/${encodeURIComponent(userId)}/visibility`, body));
}

export function updateProfileBoost(userId, body) {
  return unwrap(api.patch(`/admin/profiles/${encodeURIComponent(userId)}/boost`, body));
}

export function updateProfilePrivacy(userId, body) {
  return unwrap(api.patch(`/admin/profiles/${encodeURIComponent(userId)}/privacy`, body));
}

export function moderateProfilePhoto(userId, photoId, body) {
  return unwrap(
    api.patch(
      `/admin/profiles/${encodeURIComponent(userId)}/photos/${encodeURIComponent(photoId)}/moderation`,
      body,
    ),
  );
}

export function removeProfilePhoto(userId, photoId, body) {
  return unwrap(
    api.delete(`/admin/profiles/${encodeURIComponent(userId)}/photos/${encodeURIComponent(photoId)}`, { data: body }),
  );
}

export async function listInterests() {
  const data = await unwrap(api.get('/interests'));
  return data?.items ?? data ?? [];
}
