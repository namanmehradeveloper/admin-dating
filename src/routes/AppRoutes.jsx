// All admin routes. Every page except /login needs a staff session; some need the ADMIN role.

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
import ExperimentsPage from '../pages/ExperimentsPage.jsx';
import FraudPage from '../pages/FraudPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MatchesPage from '../pages/MatchesPage.jsx';
import MessagingPage from '../pages/MessagingPage.jsx';
import MonitoringPage from '../pages/MonitoringPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import PaymentsPage from '../pages/PaymentsPage.jsx';
import ReferralsPage from '../pages/ReferralsPage.jsx';
import ReportDetailPage from '../pages/ReportDetailPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import StaffPage from '../pages/StaffPage.jsx';
import SubscriptionDetailPage from '../pages/SubscriptionDetailPage.jsx';
import SubscriptionsPage from '../pages/SubscriptionsPage.jsx';
import SupportPage from '../pages/SupportPage.jsx';
import SwipesPage from '../pages/SwipesPage.jsx';
import TicketDetailPage from '../pages/TicketDetailPage.jsx';
import UserDetailPage from '../pages/UserDetailPage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import VerificationDetailPage from '../pages/VerificationDetailPage.jsx';
import VerificationsPage from '../pages/VerificationsPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// Loaded on demand so the chart library is not part of the initial bundle.
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingState />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
          <Route path="/profiles" element={<Navigate to="/users" replace />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/swipes" element={<SwipesPage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/blocks" element={<BlocksPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:reportId" element={<ReportDetailPage />} />
          <Route path="/verifications" element={<VerificationsPage />} />
          <Route path="/verifications/:verificationId" element={<VerificationDetailPage />} />
          <Route path="/fraud" element={<FraudPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/:ticketId" element={<TicketDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/cms" element={<CmsPage />} />
          <Route path="/cms/:cmsId" element={<CmsDetailPage />} />
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscriptions/:userId" element={<SubscriptionDetailPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/calls" element={<CallsPage />} />
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
