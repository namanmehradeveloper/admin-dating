# Admin Database Changes

**Audit date:** 2026-10-16  
**Policy:** No destructive schema changes. Prefer additive fields and new collections. Do not rename/drop fields used by the Flutter member app or existing admin services.

---

## 1. Existing models used by admin

These Mongoose models under `backend/src/models/` are already read and/or written by admin services:

| Model | Admin use |
| --- | --- |
| `User` | List/search, detail, status changes, staff session, dashboard counts, campaign audiences |
| `Profile` | User detail review, search by display name, report content, verification profile photos |
| `Report` | Moderation queue and updates |
| `VerificationRequest` | Selfie verification queue and review |
| `Match` | Per-user matches, dashboard counts; ended on suspend/ban |
| `Message` | Message **counts** on matches; reported message content when targeted |
| `SubscriptionEntitlement` | ADMIN subscription list/detail, dashboard premium count, campaign premium audience |
| `SupportTicket` | Support desk list/detail/status/reply |
| `NotificationCampaign` | Campaign list/create |
| `Notification` | Inbox rows created by campaigns |
| `NotificationPreference` | Promotion opt-in filter for campaigns |
| `AuditLog` | Staff write trail; ADMIN list/detail |
| `AppSetting` | Editable numeric settings |
| `Media` | Verification selfie URLs |
| `Device` | Indirect (logout-all / status side effects via auth paths; push not configured) |
| `Interest` | Labels on profile review |

**Member-domain models now also used by dedicated admin modules**

| Model | Admin use |
| --- | --- |
| `Swipe` | Swipe stats + ADMIN per-member investigation |
| `Block` | Block list + stats (no silent unblock) |
| `Conversation` | Messaging volume stats (metadata only) |
| `OtpSession`, `RefreshToken`, `IdempotencyRecord` | Auth/infra; not admin CRUD surfaces |

**Still missing domain models:** government ID verification, voice/video calls, boosts / premium feature packs.

---

## 2. Schema change policy

| Allowed | Not allowed |
| --- | --- |
| New collections for new modules | Dropping collections used by mobile |
| Optional additive fields with safe defaults | Renaming required fields without a migration plan |
| New indexes that do not break uniqueness contracts | Removing unique indexes relied on by member flows |
| Soft flags / status enums extended carefully | Storing card PAN/CVV, raw biometrics, or unrestricted chat dumps |

Admin presenters must continue to **omit exact geolocation** even if `Profile.location` remains for member discovery (`2dsphere` index).

---

## 3. Additive models

### Done (this session)

| Model | Id prefix | Purpose |
| --- | --- | --- |
| `CmsContent` | `cms_` | Banners, FAQs, pages, tips, guidelines |
| `Coupon` | `cpn_` | Promo codes (PERCENT/FIXED) |
| `ReferralCode` | `ref_` | Referral codes + invite/conversion counts |
| `UserRiskSignal` | `rsk_` | Rule-based fraud signals |
| `Experiment` | `exp_` | A/B experiment definitions |

Exported from `backend/src/models/index.js`.

### Still planned

| Planned model | Intended purpose |
| --- | --- |
| Boost-related collection | Boost inventory / grants |
| Call session models | Voice/video call admin (when domain exists) |
| Government ID verification | Only with secure retention controls |

---

## 4. Indexes already present

Relevant indexes already defined on schemas (do not recreate blindly; verify before adding duplicates):

### User

- Unique partial: `phoneNumber`, `email`
- `{ status: 1, createdAt: -1 }`
- `{ role: 1 }`

### Profile

- Unique `{ userId: 1 }`
- Sparse `2dsphere` on `location`
- `{ createdAt: -1, _id: -1 }`
- `{ 'photos._id': 1 }`

### Report

- `{ status: 1, createdAt: -1 }`
- `{ targetUserId: 1, createdAt: -1 }`
- `{ reporterId: 1, createdAt: -1 }`

### VerificationRequest

- `{ status: 1, createdAt: -1 }`
- `{ userId: 1, createdAt: -1 }`

### Match

- Unique `{ pairKey: 1 }`
- `{ userIds: 1, status: 1, matchedAt: -1 }`

### Message

- `{ conversationId: 1, sentAt: -1, _id: -1 }`
- Additional attachment / uniqueness indexes as defined in `Message.js`

### SupportTicket

- `{ userId: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`

### NotificationCampaign

- `{ createdAt: -1 }`

### Notification

- `{ userId: 1, createdAt: -1 }`

### NotificationPreference

- Unique `{ userId: 1 }`

### SubscriptionEntitlement

- Unique `{ userId: 1 }`
- Active/expiry-oriented indexes as in model file
- `{ updatedAt: -1 }`

### AuditLog

- `{ createdAt: -1 }`
- `{ actorId: 1, createdAt: -1 }`
- `{ targetId: 1, createdAt: -1 }`

### AppSetting

- Unique `{ key: 1 }`

### Swipe / Block / Conversation / Media / Device / RefreshToken / etc.

Present for member flows; see individual model files. Admin Phase 2 work should reuse these indexes for list queries where possible.

---

## 5. Settings keys (AppSetting)

Editable keys live in `EDITABLE_SETTINGS` (`backend/src/config/catalog.js`), not as free-form DB documents:

| Key | Default | Min | Max |
| --- | --- | --- | --- |
| `freeDailyLikes` | 50 | 1 | 1000 |
| `freeDailySuperLikes` | 1 | 0 | 100 |
| `verificationDailyLimit` | 3 | 1 | 20 |

New settings should be added to `EDITABLE_SETTINGS` first, then stored via existing `AppSetting` upsert — not as secret env vars returned to the client.

---

## 6. Change log

| Date | Change | Status |
| --- | --- | --- |
| 2026-10-16 | Documentation of existing models/indexes; planned models listed | Documented only — no schema migration in this commit |
