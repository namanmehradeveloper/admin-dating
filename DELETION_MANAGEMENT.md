# Deletion Management

Monitoring of account deletion plus cancel, safe retry for failed purges, and Super Admin force purge. Live scheduling remains on `User.deletion` via `POST /admin/users/:userId/deletion` (members from Users; staff from Staff for Super Admin).

## Architecture

- **Scheduler (unchanged grace):** `User.deletion` + `account.service.requestDeletion` (14-day grace).
- **Login cancel (unchanged):** `auth.service.cancelPendingDeletion` — member (and any account) sign-in during grace cancels pending deletion.
- **Admin cancel (new):** `POST /deletion-management/:recordId/cancel` resets `User.deletion` and marks the ledger `CANCELLED` with `cancelReason: ADMIN`.
- **Worker (extended):** `jobs/accountDeletion.job.js` still runs hourly; isolates per-user failures and updates the ledger.
- **Force purge (new):** Super Admin only — `POST /deletion-management/:recordId/purge` with `{ confirm: true }` bypasses remaining grace via `eraseAccount` (`ADMIN_FORCE`).
- **Ledger:** `AccountDeletionRecord` — durable history/monitoring that survives `User` hard-delete (members and staff).

## Permissions

Module: `DELETION_MANAGEMENT`

| Action | Use |
|--------|-----|
| `VIEW` | Stats, list, detail |
| `EDIT` | Retry failed purge |
| `DELETE` | Cancel scheduled deletion; force purge (route gate; service also requires Super Admin for force purge) |
| `CREATE` | Reserved / unused for schedule (schedule stays on `USERS.DELETE`) |

Defaults: Super Admin / Admin (full matrix via catalog), Moderator / Support Agent / Analyst (`VIEW`). Super Admin permissions are always re-synced from the catalog on seed.

## Protections (backend-enforced)

- Actor cannot schedule / hard-delete / force-purge their own account.
- Only Super Admin may schedule deletion of staff accounts (Admin/Moderator/Support/etc.).
- Cannot demote, suspend, schedule-delete, hard-delete, or force-purge the last **active** Super Admin (`status: ACTIVE` and not already `deletion.status: SCHEDULED`).
- Existing last **admin-tier** (`SUPER_ADMIN` + `ADMIN`) guards remain for demote / suspend / hard-delete.

## APIs

### `GET /api/v1/admin/deletion-management/stats`

Auth: `DELETION_MANAGEMENT.VIEW`

### `GET /api/v1/admin/deletion-management?tab=&q=&source=&cursor=&limit=`

Auth: `DELETION_MANAGEMENT.VIEW`

### `GET /api/v1/admin/deletion-management/:recordId`

Auth: `DELETION_MANAGEMENT.VIEW`

Response includes `canRetry`, `canCancel`, `canForcePurge` (force only when viewer is Super Admin).

### `POST /api/v1/admin/deletion-management/:recordId/retry`

Auth: `DELETION_MANAGEMENT.EDIT`

Only when ledger `status=FAILED`, live `User.deletion.status=SCHEDULED`, and grace period ended. Audits `USER_DELETION_PURGE_RETRIED`.

### `POST /api/v1/admin/deletion-management/:recordId/cancel`

Auth: `DELETION_MANAGEMENT.DELETE`

Cancels `SCHEDULED` or `FAILED` rows while the live account is still scheduled. Audits `USER_DELETION_CANCELLED`.

### `POST /api/v1/admin/deletion-management/:recordId/purge`

Auth: `DELETION_MANAGEMENT.DELETE` + actor role `SUPER_ADMIN`

Body: `{ "confirm": true }`

Immediately erases the account (grace bypass). Audits `USER_DELETION_FORCE_PURGED`.

### `POST /api/v1/admin/users/:userId/deletion`

Auth: `USERS.DELETE`

Body: `{ "reason": "..." }`

Schedules 14-day grace. Members: Admin or Super Admin. Staff: Super Admin only.

## Ledger statuses

| Status | Meaning |
|--------|---------|
| `SCHEDULED` | Grace period active (or due until job claims it) |
| `READY` | Purge lock acquired / in progress |
| `FAILED` | Last erase attempt failed; eligible for retry when due |
| `PURGED` | User hard-deleted; snapshot retained |
| `CANCELLED` | Cancelled via login or admin cancel |

## Attempt triggers

`JOB` | `ADMIN_RETRY` | `ADMIN_FORCE`

## Admin UI

Route: `/deletion-management` (People → Deletion management). Detail drawer: Retry, Cancel deletion, Force purge now (when allowed).
