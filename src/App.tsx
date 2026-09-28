import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Role } from './lib/api';
import { returnTo } from './lib/routes';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyBusinessPage from './pages/VerifyBusinessPage';
import VerificationStatusPage from './pages/VerificationStatusPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import BuyerDashboardPage from './pages/buyer/BuyerDashboardPage';
import LotBrowsePage from './pages/buyer/LotBrowsePage';
import LotDetailPage from './pages/buyer/LotDetailPage';
import MyBidsPage from './pages/buyer/MyBidsPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import PaymentSuccessPage from './pages/buyer/PaymentSuccessPage';
import PaymentFailedPage from './pages/buyer/PaymentFailedPage';
import InvoicePage from './pages/buyer/InvoicePage';
import BuyerSettingsPage from './pages/buyer/BuyerSettingsPage';
import NotificationsPage from './pages/buyer/NotificationsPage';
import FileDisputePage from './pages/buyer/FileDisputePage';
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import InventoryPage from './pages/seller/InventoryPage';
import LotWizardPage from './pages/seller/LotWizardPage';
import EditDraftPage from './pages/seller/EditDraftPage';
import LotPerformancePage from './pages/seller/LotPerformancePage';
import PayoutsPage from './pages/seller/PayoutsPage';
import SellerSettingsPage from './pages/seller/SellerSettingsPage';
import SellerNotificationsPage from './pages/seller/SellerNotificationsPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import VerificationQueuePage from './pages/admin/VerificationQueuePage';
import VerificationDetailPage from './pages/admin/VerificationDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import DisputeQueuePage from './pages/admin/DisputeQueuePage';
import DisputeDetailPage from './pages/admin/DisputeDetailPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import PlatformSettingsPage from './pages/admin/PlatformSettingsPage';
import NotFoundPage from './pages/system/NotFoundPage';
import ForbiddenPage from './pages/system/ForbiddenPage';
import SessionExpiredOverlay from './pages/system/SessionExpiredOverlay';
import type { ReactNode } from 'react';

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    returnTo.set(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) return <ForbiddenPage required={roles} />;
  return <>{children}</>;
}

const BUYER: Role[] = ['BUYER'];
const SELLER: Role[] = ['SELLER'];
const ADMIN: Role[] = ['ADMIN'];
const ANY_ROLE: Role[] = ['BUYER', 'SELLER', 'ADMIN'];

const buyerRoutes: [string, ReactNode][] = [
  ['/buyer', <BuyerDashboardPage />],
  ['/buyer/bids', <MyBidsPage />],
  ['/buyer/checkout/:paymentId', <CheckoutPage />],
  ['/buyer/checkout/:paymentId/success', <PaymentSuccessPage />],
  ['/buyer/checkout/:paymentId/failed', <PaymentFailedPage />],
  ['/buyer/invoices/:paymentId', <InvoicePage />],
  ['/buyer/settings', <BuyerSettingsPage />],
  ['/buyer/notifications', <NotificationsPage />],
  ['/buyer/disputes/new', <FileDisputePage />],
];

const sellerRoutes: [string, ReactNode][] = [
  ['/seller', <SellerDashboardPage />],
  ['/seller/listings', <InventoryPage />],
  ['/seller/lots/new', <LotWizardPage />],
  ['/seller/lots/:id/edit', <EditDraftPage />],
  ['/seller/lots/:id', <LotPerformancePage />],
  ['/seller/payouts', <PayoutsPage />],
  ['/seller/settings', <SellerSettingsPage />],
  ['/seller/notifications', <SellerNotificationsPage />],
];

const adminRoutes: [string, ReactNode][] = [
  ['/admin', <AdminOverviewPage />],
  ['/admin/verifications', <VerificationQueuePage />],
  ['/admin/verifications/:userId', <VerificationDetailPage />],
  ['/admin/users', <UserManagementPage />],
  ['/admin/categories', <CategoriesPage />],
  ['/admin/disputes', <DisputeQueuePage />],
  ['/admin/disputes/:id', <DisputeDetailPage />],
  ['/admin/audit-log', <AuditLogPage />],
  ['/admin/settings', <PlatformSettingsPage />],
];

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route
          path="/verify-business"
          element={
            <RequireAuth>
              <VerifyBusinessPage />
            </RequireAuth>
          }
        />
        <Route
          path="/verification-status"
          element={
            <RequireAuth>
              <VerificationStatusPage />
            </RequireAuth>
          }
        />

        {/* Every role can open the catalog: sellers preview their lots, operators check disputed ones. */}
        <Route
          path="/lots"
          element={
            <RequireAuth roles={ANY_ROLE}>
              <LotBrowsePage />
            </RequireAuth>
          }
        />
        <Route
          path="/lots/:id"
          element={
            <RequireAuth roles={ANY_ROLE}>
              <LotDetailPage />
            </RequireAuth>
          }
        />
        {buyerRoutes.map(([path, element]) => (
          <Route
            key={path}
            path={path}
            element={<RequireAuth roles={BUYER}>{element}</RequireAuth>}
          />
        ))}
        {sellerRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={<RequireAuth roles={SELLER}>{element}</RequireAuth>} />
        ))}
        {adminRoutes.map(([path, element]) => (
          <Route key={path} path={path} element={<RequireAuth roles={ADMIN}>{element}</RequireAuth>} />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SessionExpiredOverlay />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
