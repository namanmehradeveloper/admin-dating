// All admin routes. Pages are gated by module VIEW permissions from /admin/me (API enforces too).

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingState from '../components/LoadingState.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AnalyticsPage from '../pages/AnalyticsPage.jsx';
import AuditLogsPage from '../pages/AuditLogsPage.jsx';
import BlocksPage from '../pages/BlocksPage.jsx';
import CallsPage from '../pages/CallsPage.jsx';
import CmsDetailPage from '../pages/CmsDetailPage.jsx';
import CmsPage from '../pages/CmsPage.jsx';
import CouponsPage from '../pages/CouponsPage.jsx';
import StorePage from '../pages/StorePage.jsx';
import ExperimentsPage from '../pages/ExperimentsPage.jsx';
import FraudPage from '../pages/FraudPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import LoginActivityPage from '../pages/LoginActivityPage.jsx';
import MatchesPage from '../pages/MatchesPage.jsx';
import MessagingPage from '../pages/MessagingPage.jsx';
import MonitoringPage from '../pages/MonitoringPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import PaymentDetailPage from '../pages/PaymentDetailPage.jsx';
import PaymentsPage from '../pages/PaymentsPage.jsx';
import ReferralsPage from '../pages/ReferralsPage.jsx';
import ReportDetailPage from '../pages/ReportDetailPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import StaffPage from '../pages/StaffPage.jsx';
import SubscriptionAnalyticsPage from '../pages/SubscriptionAnalyticsPage.jsx';
import SubscriptionDetailPage from '../pages/SubscriptionDetailPage.jsx';
import SubscriptionPlansPage from '../pages/SubscriptionPlansPage.jsx';
import SubscriptionsPage from '../pages/SubscriptionsPage.jsx';
import SupportPage from '../pages/SupportPage.jsx';
import SwipesPage from '../pages/SwipesPage.jsx';
import TicketDetailPage from '../pages/TicketDetailPage.jsx';
import UserDetailPage from '../pages/UserDetailPage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import DeletionManagementPage from '../pages/DeletionManagementPage.jsx';
import VerificationDetailPage from '../pages/VerificationDetailPage.jsx';
import VerificationsPage from '../pages/VerificationsPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute permission="DASHBOARD.VIEW" />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingState />}>
                  <DashboardPage />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute permission="USERS.VIEW" />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:userId" element={<UserDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="DELETION_MANAGEMENT.VIEW" />}>
            <Route path="/deletion-management" element={<DeletionManagementPage />} />
          </Route>
          <Route path="/profiles" element={<Navigate to="/users" replace />} />

          <Route element={<ProtectedRoute permission="MATCHES.VIEW" />}>
            <Route path="/matches" element={<MatchesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="SWIPES.VIEW" />}>
            <Route path="/swipes" element={<SwipesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="MESSAGING.VIEW" />}>
            <Route path="/messaging" element={<MessagingPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="BLOCKS.VIEW" />}>
            <Route path="/blocks" element={<BlocksPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="ANALYTICS.VIEW" />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="REPORTS.VIEW" />}>
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:reportId" element={<ReportDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="VERIFICATIONS.VIEW" />}>
            <Route path="/verifications" element={<VerificationsPage />} />
            <Route path="/verifications/:verificationId" element={<VerificationDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="FRAUD.VIEW" />}>
            <Route path="/fraud" element={<FraudPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="SUPPORT.VIEW" />}>
            <Route path="/support" element={<SupportPage />} />
            <Route path="/support/:ticketId" element={<TicketDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="NOTIFICATIONS.VIEW" />}>
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="CMS.VIEW" />}>
            <Route path="/cms" element={<CmsPage />} />
            <Route path="/cms/:cmsId" element={<CmsDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="AUDIT_LOGS.VIEW" />}>
            <Route path="/security/login-activity" element={<LoginActivityPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="STAFF.VIEW" />}>
            <Route path="/staff" element={<StaffPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="SUBSCRIPTIONS.VIEW" />}>
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscriptions/analytics" element={<SubscriptionAnalyticsPage />} />
            <Route path="/subscriptions/plans" element={<SubscriptionPlansPage />} />
            <Route path="/subscriptions/:userId" element={<SubscriptionDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="PAYMENTS.VIEW" />}>
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/:paymentId" element={<PaymentDetailPage />} />
            <Route path="/store" element={<StorePage />} />
          </Route>
          <Route element={<ProtectedRoute permission="COUPONS.VIEW" />}>
            <Route path="/coupons" element={<CouponsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="REFERRALS.VIEW" />}>
            <Route path="/referrals" element={<ReferralsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="CALLS.VIEW" />}>
            <Route path="/calls" element={<CallsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="EXPERIMENTS.VIEW" />}>
            <Route path="/experiments" element={<ExperimentsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="MONITORING.VIEW" />}>
            <Route path="/monitoring" element={<MonitoringPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="SETTINGS.VIEW" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
