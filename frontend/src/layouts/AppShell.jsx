import { Outlet, useLocation } from 'react-router-dom'
import AppNavigation from './AppNavigation'
import './AppShell.css'

/** Shared customer/admin frame. */
export default function AppShell({ links }) {
  const { pathname } = useLocation()

  return (
    <div className="shell">
      <AppNavigation links={links} />
      <main className="shell__main">
        {/* the key restarts the enter animation on every page change */}
        <div className="shell__page" key={pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}