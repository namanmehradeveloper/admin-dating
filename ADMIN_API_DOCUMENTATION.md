# Admin API Documentation

**Base URL:** `/api/v1`  
**Admin prefix:** `/api/v1/admin`  
**Audit date:** 2026-10-16  

This document covers **existing** admin (and shared login) endpoints only. New routes will be added as modules land; keep this file in sync when they do.

---

## Conventions

### Auth

| Item | Detail |
| --- | --- |
| Header | `Authorization: Bearer <accessToken>` |
| Staff roles | `MODERATOR`, `ADMIN` (from `User.role` in MongoDB on each request) |
| Default gate | All `/admin/*` routes require auth + role `MODERATOR` or `ADMIN` |
| ADMIN-only | Subscriptions, `POST /admin/notifications`, audit logs, settings |
| Rate limit | 300 requests / minute / authenticated user on `/admin` |

### Response envelope

Success:

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "…" }
}
```

Error:

```json
{
  "success": false,
  "error": { "code": "…", "message": "…", "details": [] },
  "meta": { "requestId": "…" }
}
```

Created resources use HTTP `201` where noted; otherwise `200`.

### Pagination (list endpoints)

| Query | Rules |
| --- | --- |
| `limit` | Optional integer; default `20`, max `50` |
| `cursor` | Opaque cursor from previous `nextCursor` |

List `data` shape: `{ "items": […], "nextCursor": "<string|null>" }`.

### User card (embedded)

Used across reports, tickets, campaigns, audit logs, etc.:

| Field | Type |
| --- | --- |
| `id` | string |
| `displayName` | string |
| `photoUrl` | string \| null |
| `role` | `USER` \| `MODERATOR` \| `ADMIN` \| null |
| `status` | account status or `DELETED` |

Contact fields on user summaries: MODERATOR sees masked email/phone; ADMIN sees full values.

---

## Authentication (shared)

Admin staff and members share email/password login. The admin SPA uses the same endpoint, then calls `/admin/me` to restore the staff session.

### `POST /auth/login`

| | |
| --- | --- |
| **Auth** | Public |
| **Rate limits** | 10 / email / 15 min; 100 / IP / hour |
| **Body** | `{ "email": string, "password": string }` |
| **Response `data`** | `{ "user": { "id", "onboardingComplete", "role" }, "isNewUser": boolean, "tokens": { access + refresh session tokens } }` |

Staff must have `role` `MODERATOR` or `ADMIN`. Member tokens receive `403 FORBIDDEN` on `/admin/*`.

Related (not admin-specific): `POST /auth/token/refresh`, `POST /auth/logout`, `POST /auth/logout-all`.

---

## Session and dashboard

### `GET /admin/me`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Response `data`** | `{ "id", "email", "role", "status", "createdAt" }` |

### `GET /admin/dashboard`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | `days` — `7` \| `30` \| `90` (invalid → `7`) |
| **Response `data`** | Aggregates: `users`, `moderation`, `matches`, `messages`, `support`, `subscriptions`, `signupsByDay`, `range`, `trends`, `breakdowns`, `generatedAt` |

---

## Users

### `GET /admin/users`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | `q` (≤100 chars: id, email, phone, or display name), `status` (`ACTIVE`\|`WARNED`\|`SUSPENDED`\|`BANNED`), `role` (`USER`\|`MODERATOR`\|`ADMIN`), `verificationStatus` (`NONE`\|`PENDING`\|`VERIFIED`\|`REJECTED`), plus pagination |
| **Response `data`** | `{ items: AdminUserSummary[], nextCursor }` |

`AdminUserSummary` includes user card fields, contact (masked per role), `verificationStatus`, `onboardingComplete`, `deletionScheduled`, `createdAt`, `lastActiveAt`.

### `GET /admin/users/:userId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Response `data`** | Summary + `statusReason`, `suspendedUntil`, `deletion`, `profile` (review shape or null), `entitlement`, `stats` (`reportsAgainst`, `openReportsAgainst`, `reportsMade`, `activeMatches`) |

`profile` includes display name, age, gender, bio, city, occupation, relationship goal, interests, photos (`id`, `url`, `order`) — **not** exact coordinates.

### `GET /admin/users/:userId/reports`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | `direction` = `against` (default) \| `by`, plus pagination |
| **Response `data`** | `{ items: ReportSummary[], nextCursor }` |

### `GET /admin/users/:userId/matches`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | pagination |
| **Response `data`** | `{ items: [{ id, status, otherUser, matchedAt, endedAt, endedReason, conversationId, messageCount }], nextCursor }` |

`messageCount` only — no message bodies.

### `PATCH /admin/users/:userId/status`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN (with extra rules) |
| **Body** | `{ "status": ACCOUNT_STATUS, "reason": string (3–500), "until"?: ISO timestamp }` |
| **Rules** | `until` only when `status === SUSPENDED` and must be future. Actor cannot change self. Only ADMIN may change staff accounts or ban/unban. Suspend/ban revokes tokens, ends sockets, ends matches. |
| **Response `data`** | Full user detail (same as `GET …/:userId`) |
| **Audit** | `USER_STATUS_CHANGED` |

---

## Reports

### `GET /admin/reports`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | `status` (`OPEN`\|`IN_REVIEW`\|`ACTIONED`\|`DISMISSED`), `targetType` (`USER`\|`PHOTO`\|`MESSAGE`), `reason` (see enum below), pagination |
| **Response `data`** | `{ items: ReportSummary[], nextCursor }` |

Report reasons: `FAKE_PROFILE`, `INAPPROPRIATE_PHOTOS`, `HARASSMENT`, `SPAM_OR_SCAM`, `UNDERAGE`, `OFFLINE_BEHAVIOUR`, `OTHER`.

`ReportSummary`: `id`, `targetType`, `targetId`, `reason`, `status`, `reporter`, `reportedUser`, `assignedModerator`, `createdAt`, `updatedAt`.

### `GET /admin/reports/:reportId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Response `data`** | Summary + `details`, `resolutionNote`, `resolvedAt`, `content` (reported message/photo/profile or null), `previousReportsAgainstUser`, `history[]` |

### `PATCH /admin/reports/:reportId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Body** | At least one of: `status` (`IN_REVIEW`\|`ACTIONED`\|`DISMISSED`), `resolutionNote` (≤1000), `assignToMe` (boolean) |
| **Notes** | Closed (`ACTIONED` / `DISMISSED`) reports cannot be reopened |
| **Response `data`** | Full report detail |
| **Audit** | Recorded on update |

---

## Verifications (selfie)

### `GET /admin/verifications`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | `status` (`PENDING`\|`APPROVED`\|`REJECTED`), pagination |
| **Response `data`** | `{ items: [{ id, status, user, submittedAt, reviewedAt }], nextCursor }` |

### `GET /admin/verifications/:verificationId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Response `data`** | Summary + `selfieUrl`, `profilePhotos[]`, `reason`, `reviewedBy` |

No government-ID fields exist on this model.

### `PATCH /admin/verifications/:verificationId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Body** | `{ "status": "APPROVED" \| "REJECTED", "reason"?: string }` — `reason` required (3–500) when rejecting |
| **Notes** | Only `PENDING` requests; sets user `verificationStatus` to `VERIFIED` or `REJECTED` |
| **Response `data`** | Full verification detail |
| **Audit** | `VERIFICATION_REVIEWED` |

---

## Subscriptions (ADMIN only)

### `GET /admin/subscriptions`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Query** | `tier` (`FREE`\|`PLUS`), `isActive` (`true`\|`false`), pagination |
| **Response `data`** | `{ items: [{ userId, user, entitlement fields, productId, updatedAt }], nextCursor }` |

### `GET /admin/subscriptions/:userId`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Response `data`** | `{ user, entitlement, storeVerification: { configured: false, status: "FEATURE_NOT_CONFIGURED" } }` |

Read-only. Entitlements are not granted or revoked from admin.

---

## Support

### `GET /admin/support/tickets`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | `status` (`OPEN`\|`IN_PROGRESS`\|`RESOLVED`\|`CLOSED`), `category` (`ACCOUNT`\|`BILLING`\|`SAFETY`\|`BUG`\|`OTHER`), pagination |
| **Response `data`** | `{ items: TicketSummary[], nextCursor }` |

### `GET /admin/support/tickets/:ticketId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Response `data`** | Summary + `messages[]` (`id`, `author` USER\|STAFF, `authorUser`, `body`, `createdAt`) |

### `PATCH /admin/support/tickets/:ticketId`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Body** | `{ "status": TICKET_STATUS }` |
| **Response `data`** | Full ticket |
| **Audit** | `TICKET_STATUS_CHANGED` |

### `POST /admin/support/tickets/:ticketId/messages`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Body** | `{ "body": string (1–5000) }` |
| **Notes** | Closed tickets cannot be replied to without reopening; `OPEN` → `IN_PROGRESS` on staff reply |
| **Response `data`** | Full ticket (`201`) |
| **Audit** | `TICKET_REPLIED` |

---

## Notifications

### `GET /admin/notifications`

| | |
| --- | --- |
| **Roles** | MODERATOR, ADMIN |
| **Query** | pagination |
| **Response `data`** | `{ items: Campaign[], nextCursor }` |

Campaign: `id`, `title`, `body`, `type`, `audience`, `targetUserId`, `recipientCount`, `pushStatus`, `createdBy`, `createdAt`.

### `POST /admin/notifications`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Body** | `{ "title": ≤80, "body": ≤500, "type": "ANNOUNCEMENT" \| "PROMOTION", "audience": "ALL_USERS" \| "VERIFIED_USERS" \| "PREMIUM_USERS" \| "FREE_USERS" \| "SINGLE_USER", "targetUserId"?: string }` |
| **Notes** | `targetUserId` required only for `SINGLE_USER`. Creates inbox rows; push may be `FEATURE_NOT_CONFIGURED`. Promotions respect opt-in preferences. |
| **Response `data`** | Campaign (`201`) |
| **Audit** | `NOTIFICATION_SENT` |

---

## Audit logs (ADMIN only)

### `GET /admin/audit-logs`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Query** | `actorId`, `targetId`, `action`, `targetType` (optional text filters), pagination |
| **Response `data`** | `{ items: [{ id, actor, actorRole, action, targetType, targetId, metadata, relatedUsers, createdAt }], nextCursor }` |

### `GET /admin/audit-logs/:auditLogId`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Response `data`** | Single audit entry (same shape as list item) |

---

## Settings (ADMIN only)

### `GET /admin/settings`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Response `data`** | `{ "settings": EditableSetting[], "system": SystemInfo }` |

`EditableSetting`: `key`, `value`, `defaultValue`, `min`, `max`, `updatedAt`.

Current editable keys:

| Key | Default | Range |
| --- | --- | --- |
| `freeDailyLikes` | 50 | 1–1000 |
| `freeDailySuperLikes` | 1 | 0–100 |
| `verificationDailyLimit` | 3 | 1–20 |

`system` (non-secret): `environment`, `currentTermsVersion`, `otpMode`, `pushNotificationsConfigured`, `storeBillingConfigured`, `socialSignInConfigured`.

### `PATCH /admin/settings`

| | |
| --- | --- |
| **Roles** | ADMIN |
| **Body** | Object with one or more editable keys → integer values in range |
| **Response `data`** | Same shape as `GET /admin/settings` |
| **Audit** | `SETTINGS_UPDATED` |

---

## Related non-admin health check

### `GET /health`

| | |
| --- | --- |
| **Auth** | Public |
| **Path** | `/api/v1/health` |
| **Notes** | API + MongoDB liveness; not an admin-authenticated monitoring console |

---

## Endpoint inventory (quick reference)

| Method | Path | Roles |
| --- | --- | --- |
| POST | `/auth/login` | Public |
| GET | `/admin/me` | MODERATOR, ADMIN |
| GET | `/admin/dashboard` | MODERATOR, ADMIN |
| GET | `/admin/users` | MODERATOR, ADMIN |
| GET | `/admin/users/:userId` | MODERATOR, ADMIN |
| GET | `/admin/users/:userId/reports` | MODERATOR, ADMIN |
| GET | `/admin/users/:userId/matches` | MODERATOR, ADMIN |
| PATCH | `/admin/users/:userId/status` | MODERATOR, ADMIN\* |
| GET | `/admin/reports` | MODERATOR, ADMIN |
| GET | `/admin/reports/:reportId` | MODERATOR, ADMIN |
| PATCH | `/admin/reports/:reportId` | MODERATOR, ADMIN |
| GET | `/admin/verifications` | MODERATOR, ADMIN |
| GET | `/admin/verifications/:verificationId` | MODERATOR, ADMIN |
| PATCH | `/admin/verifications/:verificationId` | MODERATOR, ADMIN |
| GET | `/admin/subscriptions` | ADMIN |
| GET | `/admin/subscriptions/:userId` | ADMIN |
| GET | `/admin/support/tickets` | MODERATOR, ADMIN |
| GET | `/admin/support/tickets/:ticketId` | MODERATOR, ADMIN |
| PATCH | `/admin/support/tickets/:ticketId` | MODERATOR, ADMIN |
| POST | `/admin/support/tickets/:ticketId/messages` | MODERATOR, ADMIN |
| GET | `/admin/notifications` | MODERATOR, ADMIN |
| POST | `/admin/notifications` | ADMIN |
| GET | `/admin/audit-logs` | ADMIN |
| GET | `/admin/audit-logs/:auditLogId` | ADMIN |
| GET | `/admin/settings` | ADMIN |
| PATCH | `/admin/settings` | ADMIN |
| GET | `/admin/matches` | MODERATOR, ADMIN |
| GET | `/admin/matches/stats` | MODERATOR, ADMIN |
| GET | `/admin/swipes/stats` | MODERATOR, ADMIN |
| GET | `/admin/swipes` | ADMIN (`userId` required) |
| GET | `/admin/blocks` | MODERATOR, ADMIN |
| GET | `/admin/blocks/stats` | MODERATOR, ADMIN |
| GET | `/admin/staff` | ADMIN |
| POST | `/admin/staff` | ADMIN |
| PATCH | `/admin/staff/:userId/role` | ADMIN |
| GET | `/admin/profiles` | MODERATOR, ADMIN |
| DELETE | `/admin/profiles/:userId/photos/:photoId` | MODERATOR, ADMIN |
| GET | `/admin/messaging/stats` | MODERATOR, ADMIN |
| GET | `/admin/analytics` | MODERATOR, ADMIN |
| GET | `/admin/monitoring` | ADMIN |
| GET | `/admin/cms` | MODERATOR, ADMIN |
| GET | `/admin/cms/:id` | MODERATOR, ADMIN |
| POST | `/admin/cms` | ADMIN |
| PATCH | `/admin/cms/:id` | ADMIN |
| GET | `/admin/coupons` | ADMIN |
| GET | `/admin/coupons/stats` | ADMIN |
| POST | `/admin/coupons` | ADMIN |
| PATCH | `/admin/coupons/:id` | ADMIN |
| GET | `/admin/referrals` | ADMIN |
| GET | `/admin/referrals/stats` | ADMIN |
| POST | `/admin/referrals` | ADMIN |
| PATCH | `/admin/referrals/:id` | ADMIN |
| GET | `/admin/fraud/status` | MODERATOR, ADMIN |
| GET | `/admin/fraud/signals` | MODERATOR, ADMIN |
| POST | `/admin/fraud/scan/:userId` | MODERATOR, ADMIN |
| PATCH | `/admin/fraud/signals/:id` | MODERATOR, ADMIN |
| GET | `/admin/experiments` | ADMIN |
| GET | `/admin/experiments/:id` | ADMIN |
| POST | `/admin/experiments` | ADMIN |
| PATCH | `/admin/experiments/:id` | ADMIN |
| GET | `/admin/calls/status` | ADMIN |
| GET | `/admin/payments/status` | ADMIN |

\*Additional business rules for ban/staff targets — see status change section.

New routes follow the same `ApiResponse` envelope, cursor pagination, and audit patterns as existing admin APIs. Full request/response shapes live in `admin.validator.js` and the corresponding `admin/*.service.js` files.

---

## Source of truth in code

- Routes: `backend/src/routes/admin.routes.js`, `backend/src/routes/auth.routes.js`
- Handlers: `backend/src/controllers/admin.controller.js`
- Validators: `backend/src/validators/admin.validator.js`
- Access tests: `backend/tests/admin/access.test.js`
