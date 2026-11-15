import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Splash from '../components/Splash'
import { homeFor, useAuth } from './useAuth'

/** Requires a logged-in user with the given role. Wrong role goes to that user's own home. */
export function RequireRole({ role }) {
  const { user, booting } = useAuth()
  const location = useLocation()
  if (booting) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />
  return <Outlet />
}

/** Pages for logged-out visitors (login, register...). Logged-in users are sent home. */
export function GuestOnly() {
  const { user, booting } = useAuth()
  if (booting) return <Splash />
  if (user) return <Navigate to={homeFor(user)} replace />
  return <Outlet />
}
