# Admin Test Results

**Last updated:** 2026-10-16  
**Scope:** Backend admin Vitest suite under `backend/tests/admin/`

---

## Latest run (this session)

```bash
cd backend && npm test -- tests/admin/
```

| Result | Value |
| --- | --- |
| Test files | **9 passed** |
| Tests | **76 passed** |
| Frontend build | `npm run build` **OK** |

---

## Suite layout

| File | Focus |
| --- | --- |
| `access.test.js` | Staff gate / role denial |
| `users.test.js` | Search, masking, status changes |
| `reports.test.js` | Moderation queue |
| `verifications.test.js` | Selfie review |
| `notifications.test.js` | Campaigns |
| `subscriptions-support.test.js` | Entitlements + tickets |
| `settings-audit.test.js` | Settings + audit immutability |
| `matches-swipes-blocks.test.js` | Matches, swipes, blocks, profiles, analytics |
| `staff-cms-fraud.test.js` | Staff, CMS, coupons, referrals, fraud, experiments, monitoring stubs |

---

## How to run

```bash
cd backend
npm test
# or
npm test -- tests/admin/
```

Admin SPA: `npm test` at repo root (axios refresh tests).

---

## Notes

- In-memory MongoDB via helpers; Supertest against `createApp()`
- Completeness score assertion fixed to match name+photo+bio+goal = 4/5
- Integration-blocked modules (calls/payments) assert honest `configured: false` responses
