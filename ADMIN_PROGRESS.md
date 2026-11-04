# Admin Progress

**Last updated:** 2026-10-16 (session resume — Phase 1 gaps + Phase 2–6 expansions landed)  
**Truthful audit of this repo only.** Statuses reflect functional FE + BE unless noted.

**Status legend**

| Status | Meaning |
| --- | --- |
| Implemented | Admin FE + BE usable for the stated scope |
| Partial | Some admin surface exists; gaps remain |
| Not started | No admin module yet (member APIs may exist) |
| Integration blocked | Depends on external provider / missing domain |

---

## Module checklist (28)

### 1. User Management — Implemented

- List / search / detail / status change; per-user reports and matches
- **Key files:** `adminUsers.service.js`, `UsersPage.jsx`, `UserDetailPage.jsx`

### 2. Profile Management — Implemented

- Profile list with completeness score; photo remove with reason + audit on user detail
- Exact location never exposed
- **Key files:** `adminProfiles.service.js`, `ProfilesPage.jsx`, `UserDetailPage.jsx`

### 3. Photo verification (selfie queue) — Partial

- Selfie queue approve/reject works; **no government ID** provider
- **Key files:** `adminVerifications.service.js`, `VerificationsPage.jsx`

### 4. Swipe / Like admin — Implemented

- Aggregate stats for staff; ADMIN per-member swipe investigation (`userId` required)
- **Key files:** `adminSwipes.service.js`, `SwipesPage.jsx`

### 5. Match — Implemented

- Global match list + stats (message **counts** only); match→chat conversion
- **Key files:** `adminMatches.service.js`, `MatchesPage.jsx`

### 6. Chat — Partial

- Messaging metadata stats only (correct privacy posture)
- Reported MESSAGE content remains on Reports detail
- **Key files:** `adminMessaging.service.js`, `MessagingPage.jsx`

### 7. Voice / Video Calls — Integration blocked

- Honest status stub: calling not implemented in API
- **Key files:** `adminCalls.service.js`, `CallsPage.jsx`

### 8. Subscriptions — Partial

- ADMIN read-only entitlements; store verify not configured
- **Key files:** `adminSubscriptions.service.js`, `SubscriptionsPage.jsx`

### 9. Payments — Integration blocked

- Honest status stub; no card storage
- **Key files:** `adminPayments.service.js`, `PaymentsPage.jsx`

### 10. Boosts — Not started

- No boost domain models yet

### 11. Reports & Safety — Implemented

- Queue, detail, assign, resolve
- **Key files:** `adminReports.service.js`, `ReportsPage.jsx`

### 12. Block / Unmatch admin — Implemented

- Block list + stats; **no silent admin unblock**
- Unmatch remains a user/moderation side-effect of status tools
- **Key files:** `adminBlocks.service.js`, `BlocksPage.jsx`

### 13. Notifications campaigns — Partial

- List + ADMIN send; push often `FEATURE_NOT_CONFIGURED`
- **Key files:** `adminNotifications.service.js`, `NotificationsPage.jsx`

### 14. Banners / CMS — Implemented

- CRUD-ish CMS (draft/publish/archive) with audit; staff read, ADMIN write
- **Key files:** `CmsContent.js`, `adminCms.service.js`, `CmsPage.jsx`, `CmsDetailPage.jsx`

### 15. Offers / Coupons — Implemented

- Coupon create/list/deactivate + stats (ADMIN); no payment processing
- **Key files:** `Coupon.js`, `adminCoupons.service.js`, `CouponsPage.jsx`

### 16. Referral — Implemented

- Referral codes create/list/deactivate + stats (ADMIN)
- **Key files:** `ReferralCode.js`, `adminReferrals.service.js`, `ReferralsPage.jsx`

### 17. Support ticketing — Implemented

- List / detail / status / staff reply
- **Key files:** `adminSupport.service.js`, `SupportPage.jsx`

### 18. AI / Fraud — Partial

- Rule-based scan + signal queue; provider marked **not configured** (no invented AI)
- **Key files:** `UserRiskSignal.js`, `adminFraud.service.js`, `FraudPage.jsx`

### 19. Matchmaking admin — Not started

- Discovery remains member-side; no algo weight admin UI yet

### 20. Location admin — Not started

- Exact location correctly hidden; no geo admin tooling (intentional)

### 21. Analytics — Implemented

- Expanded analytics page (DAU approx, funnels counts, trends) from live aggregates
- **Key files:** `adminAnalytics.service.js`, `AnalyticsPage.jsx`, `DashboardPage.jsx`

### 22. App Config / Settings — Partial

- Three editable numeric settings + system flags
- **Key files:** `settings.service.js`, `SettingsPage.jsx`

### 23. Roles / Permissions — Partial

- Fixed `USER | MODERATOR | ADMIN`; **staff CRUD** now available (ADMIN)
- No custom permission matrix / MFA yet
- **Key files:** `adminStaff.service.js`, `StaffPage.jsx`

### 24. Security / Privacy — Partial

- Contact masking, session revoke on ban/suspend, audited sensitive actions, dark/light theme
- Gaps: MFA, IP allowlists, retention admin UI

### 25. Email / SMS admin — Not started

### 26. System Monitoring — Implemented

- ADMIN monitoring from mongoose readyState, process memory/uptime, socket count, integration flags
- **Key files:** `adminMonitoring.service.js`, `MonitoringPage.jsx`

### 27. Admin Audit Logs — Implemented

- List/filter/detail; new actions include staff, photo remove, CMS, coupons, referrals, fraud, experiments
- **Key files:** `audit.service.js`, `AuditLogsPage.jsx`

### 28. Growth / Experiments — Implemented

- Experiment definitions + status controls; no fabricated conversion metrics
- **Key files:** `Experiment.js`, `adminExperiments.service.js`, `ExperimentsPage.jsx`

---

## Summary counts (2026-10-16)

| Status | Count |
| --- | --- |
| Implemented | 16 |
| Partial | 7 |
| Not started | 3 |
| Integration blocked | 2 |

---

## Verification this session

```bash
cd backend && npm test -- tests/admin/   # 76 passed
cd .. && npm run build                  # Vite build OK
```

---

## Remaining / next session

1. **Boosts** — needs new domain models + entitlements
2. **Matchmaking algorithm admin** — weights / experiment hooks on discovery
3. **Location admin** — city-level config only (never precise coords)
4. **Email / SMS admin** — OTP delivery analytics + templates when providers exist
5. **Feature flags / MFA / custom RBAC** under Settings / Security
6. Expand API docs for all new `/admin/*` routes in `ADMIN_API_DOCUMENTATION.md`
7. Keep Payments/Calls as Integration blocked until real providers exist

Do **not** add unrestricted chat browsing or store raw identity documents / card numbers.
