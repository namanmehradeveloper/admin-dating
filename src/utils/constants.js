// Enum values used by filters and forms (they mirror the API) and the sidebar navigation.

export const SYSTEM_STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'SUPPORT_AGENT',
  'FINANCE_MANAGER',
  'MARKETING_MANAGER',
  'ANALYST',
];
export const STAFF_ROLES = SYSTEM_STAFF_ROLES;
export const ADMIN_TIER_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export function isStaffRole(role) {
  return SYSTEM_STAFF_ROLES.includes(role) || (typeof role === 'string' && role.startsWith('CUSTOM_'));
}

export function isAdminTierRole(role) {
  return ADMIN_TIER_ROLES.includes(role);
}

/** SUPER_ADMIN inherits any gate that lists ADMIN. */
export function roleSatisfies(userRole, allowedRoles) {
  if (!allowedRoles?.length) return true;
  if (allowedRoles.includes(userRole)) return true;
  if (allowedRoles.includes('ADMIN') && userRole === 'SUPER_ADMIN') return true;
  return false;
}

export const ACCOUNT_STATUSES = ['ACTIVE', 'WARNED', 'SUSPENDED', 'BANNED'];
export const ROLES = ['USER', ...SYSTEM_STAFF_ROLES];
export const VERIFICATION_STATUSES = ['NONE', 'PENDING', 'VERIFIED', 'REJECTED'];

export const REPORT_STATUSES = ['OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED'];
export const REPORT_TARGET_TYPES = ['USER', 'PHOTO', 'MESSAGE'];
export const REPORT_REASONS = ['FAKE_PROFILE', 'INAPPROPRIATE_PHOTOS', 'HARASSMENT', 'SPAM_OR_SCAM', 'UNDERAGE', 'OFFLINE_BEHAVIOUR', 'OTHER'];

export const VERIFICATION_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export const VERIFICATION_SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest submitted' },
  { value: 'createdAt:asc', label: 'Oldest submitted' },
  { value: 'reviewedAt:desc', label: 'Recently reviewed' },
  { value: 'reviewedAt:asc', label: 'Least recently reviewed' },
];

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const TICKET_CATEGORIES = ['ACCOUNT', 'BILLING', 'SAFETY', 'BUG', 'OTHER'];

export const CAMPAIGN_TYPES = ['ANNOUNCEMENT', 'PROMOTION'];
export const CAMPAIGN_AUDIENCES = ['ALL_USERS', 'VERIFIED_USERS', 'PREMIUM_USERS', 'FREE_USERS', 'SINGLE_USER'];

export const MATCH_STATUSES = ['ACTIVE', 'ENDED'];
export const SWIPE_ACTIONS = ['LIKE', 'PASS', 'SUPER_LIKE'];

export const PROFILE_VISIBILITY_STATUSES = ['VISIBLE', 'HIDDEN', 'PAUSED', 'SNOOZED'];
export const PHOTO_MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
export const RELATIONSHIP_GOALS = [
  'LONG_TERM',
  'LONG_TERM_OPEN_TO_SHORT',
  'SHORT_TERM_OPEN_TO_LONG',
  'SHORT_TERM_FUN',
  'NEW_FRIENDS',
  'STILL_FIGURING_OUT',
];
export const PROFILE_GENDERS = ['WOMAN', 'MAN', 'NON_BINARY'];
export const SHOW_ME_OPTIONS = ['WOMEN', 'MEN', 'EVERYONE'];
export const COMPLETENESS_FILTERS = [
  { value: '', label: 'Any completeness' },
  { value: '0-2', label: 'Low (0–2)' },
  { value: '3-4', label: 'Medium (3–4)' },
  { value: '5-5', label: 'Complete (5)' },
];

export const CMS_TYPES = ['BANNER', 'FAQ', 'PAGE', 'TIP', 'GUIDELINE'];
export const CMS_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export const COUPON_TYPES = ['PERCENT', 'FIXED'];
export const RISK_STATUSES = ['OPEN', 'REVIEWED', 'DISMISSED'];
export const EXPERIMENT_STATUSES = ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED'];

export const AUDIT_ACTIONS = [
  'USER_CREATED',
  'USER_STATUS_CHANGED',
  'USER_DATA_EXPORTED',
  'USER_DELETION_SCHEDULED',
  'REPORT_UPDATED',
  'VERIFICATION_REVIEWED',
  'TICKET_STATUS_CHANGED',
  'TICKET_REPLIED',
  'NOTIFICATION_SENT',
  'SETTINGS_UPDATED',
  'STAFF_CREATED',
  'STAFF_ROLE_CHANGED',
  'STAFF_STATUS_CHANGED',
  'STAFF_FORCE_LOGOUT',
  'STAFF_2FA_ENABLED',
  'STAFF_2FA_DISABLED',
  'ROLE_CREATED',
  'ROLE_UPDATED',
  'ROLE_PERMISSIONS_UPDATED',
  'ROLE_DELETED',
  'SWIPE_ENTITLEMENTS_UPDATED',
  'MATCH_CONFIG_UPDATED',
  'MATCH_ENDED_BY_ADMIN',
  'PROFILE_PHOTO_REMOVED',
  'PROFILE_PHOTO_MODERATED',
  'PROFILE_UPDATED',
  'PROFILE_VISIBILITY_CHANGED',
  'PROFILE_BOOST_CHANGED',
  'PROFILE_PRIVACY_CHANGED',
  'CMS_CREATED',
  'CMS_UPDATED',
  'COUPON_CREATED',
  'COUPON_UPDATED',
  'REFERRAL_CREATED',
  'REFERRAL_UPDATED',
  'FRAUD_SCANNED',
  'FRAUD_SIGNAL_UPDATED',
  'EXPERIMENT_CREATED',
  'EXPERIMENT_UPDATED',
];

export const USER_GENDER_FILTERS = [
  { value: '', label: 'All' },
  { value: 'MAN', label: 'Male' },
  { value: 'WOMAN', label: 'Female' },
];

export const USER_ACTIVITY_FILTERS = [
  { value: '', label: 'Any activity' },
  { value: 'active', label: 'Active (30 days)' },
  { value: 'inactive', label: 'Inactive (30+ days)' },
];

export const USER_ONLINE_FILTERS = [
  { value: '', label: 'Any presence' },
  { value: 'true', label: 'Online now' },
  { value: 'false', label: 'Offline' },
];
export const AUDIT_TARGET_TYPES = [
  'USER',
  'REPORT',
  'VERIFICATION',
  'SUPPORT_TICKET',
  'NOTIFICATION_CAMPAIGN',
  'SETTINGS',
  'CMS',
  'COUPON',
  'REFERRAL',
  'RISK_SIGNAL',
  'EXPERIMENT',
  'ROLE',
];

// Human-readable names for the admin-editable settings (keys mirror the API).
export const SETTING_LABELS = {
  freeDailyLikes: 'Daily likes for free members',
  freeDailySuperLikes: 'Daily super likes for free members',
  freeDailyRewinds: 'Daily rewinds for free members (0 = premium only)',
  swipeAbuseThresholdPerDay: 'Swipe abuse threshold (swipes / 24h)',
  matchExpiryDays: 'Match expiry (days, 0 = never)',
  matchInactiveDays: 'Inactive match threshold (days without chat)',
  matchAlgorithmVersion: 'Match algorithm version number',
  matchFraudNewMatchesPerDay: 'Suspicious matches threshold (new / 24h)',
  blockAbuseThresholdPerDay: 'Block velocity threshold (blocks / 24h)',
  verificationDailyLimit: 'Verification attempts per member per day',
};

// Grouped sidebar. `roles` lists who may open the page (the API enforces the same rules).
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', roles: STAFF_ROLES }],
  },
  {
    label: 'People',
    items: [
      { to: '/users', label: 'Users', roles: STAFF_ROLES },
      { to: '/staff', label: 'Roles & permissions', roles: ['ADMIN', 'SUPER_ADMIN'] },
      { to: '/verifications', label: 'Verifications', roles: STAFF_ROLES },
    ],
  },
  {
    label: 'Dating core',
    items: [
      { to: '/matches', label: 'Matches', roles: STAFF_ROLES },
      { to: '/swipes', label: 'Swipes & likes', roles: STAFF_ROLES },
      { to: '/messaging', label: 'Messaging', roles: STAFF_ROLES },
      { to: '/blocks', label: 'Blocks', roles: STAFF_ROLES },
      { to: '/calls', label: 'Calls', roles: ['ADMIN'], badge: 'Soon' },
    ],
  },
  {
    label: 'Safety',
    items: [
      { to: '/reports', label: 'Reports', roles: STAFF_ROLES },
      { to: '/fraud', label: 'Fraud signals', roles: STAFF_ROLES },
    ],
  },
  {
    label: 'Security',
    items: [{ to: '/security/login-activity', label: 'Login activity', permission: 'AUDIT_LOGS.VIEW' }],
  },
  {
    label: 'Monetization',
    items: [
      { to: '/subscriptions', label: 'Subscriptions', roles: ['ADMIN'] },
      { to: '/payments', label: 'Payments', roles: ['ADMIN'], badge: 'Soon' },
      { to: '/coupons', label: 'Coupons', roles: ['ADMIN'] },
      { to: '/referrals', label: 'Referrals', roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Content & growth',
    items: [
      { to: '/notifications', label: 'Notifications', roles: STAFF_ROLES },
      { to: '/cms', label: 'CMS', roles: STAFF_ROLES },
      { to: '/experiments', label: 'Experiments', roles: ['ADMIN'] },
      { to: '/support', label: 'Support', roles: STAFF_ROLES },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/analytics', label: 'Analytics', roles: STAFF_ROLES },
      { to: '/monitoring', label: 'Monitoring', roles: ['ADMIN'] },
      { to: '/audit-logs', label: 'Audit logs', roles: ['ADMIN'] },
      { to: '/settings', label: 'Settings', roles: ['ADMIN'] },
    ],
  },
];

// Flat list kept for callers that only need route → roles.
export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
