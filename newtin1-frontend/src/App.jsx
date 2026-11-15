import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireRole } from './auth/RouteGuards'
import { homeFor, useAuth } from './auth/useAuth'
import Splash from './components/Splash'
import AuthLayout from './layouts/AuthLayout'
import AppShell from './layouts/AppShell'
import { ADMIN_LINKS, CUSTOMER_LINKS } from './layouts/navigationLinks'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CheckEmailPage from './pages/auth/CheckEmailPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import NotFoundPage from './pages/auth/NotFoundPage'
import ProfilePage from './pages/user/ProfilePage'
import SecurityPage from './pages/user/SecurityPage'
import FeedbackPage from './pages/user/FeedbackPage'
import PaymentMethodsPage from './pages/user/PaymentMethodsPage'
import UsersPage from './pages/admin/UsersPage'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import StorefrontLayout from './layouts/StorefrontLayout'
import ShopPage from './pages/shop/ShopPage'
import ProductDetailPage from './pages/shop/ProductDetailPage'
import WishListPage from './pages/user/WishListPage'
import AddressesPage from './pages/user/AddressesPage'
import CartPage from './pages/user/CartPage'
import OrdersPage from './pages/user/OrdersPage'
import OrderDetailPage from './pages/user/OrderDetailPage'
import AdminCatalogPage from './pages/admin/AdminCatalogPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminProcurementPage from './pages/admin/AdminProcurementPage'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'

function RootRedirect() {
  const { user, booting } = useAuth()
  if (booting) return <Splash />
  return <Navigate to={user ? homeFor(user) : '/shop'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/shop" element={<StorefrontLayout />}>
        <Route index element={<ShopPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
      </Route>

      {/* Logged-out only */}
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Reachable from email links, whether or not someone is logged in */}
      <Route element={<AuthLayout />}>
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Customer area  ->  /api/user/** */}
      <Route element={<RequireRole role="ROLE_CUSTOMER" />}>
        <Route path="/account" element={<AppShell links={CUSTOMER_LINKS} />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="wishlist" element={<WishListPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="payments" element={<PaymentMethodsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
        </Route>
      </Route>

      {/* Admin area  ->  /api/admin/** */}
      <Route element={<RequireRole role="ROLE_ADMIN" />}>
        <Route path="/admin" element={<AppShell links={ADMIN_LINKS} />}>
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="catalog" element={<AdminCatalogPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="procurement" element={<AdminProcurementPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
