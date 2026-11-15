import { Outlet } from 'react-router-dom'
import Logo from '../components/Logo'
import AppNavigation from './AppNavigation'
import './StorefrontLayout.css'

export default function StorefrontLayout() {
  return (
    <div className="store">
      <AppNavigation />
      <main className="store__main">
        <div className="store__page">
          <Outlet />
        </div>
      </main>
      <footer className="store__footer">
        <div className="store__footer-wrap">
          <Logo size={28} wordmark speed="paused" />
          <span>Thoughtful finds for everyday life.</span>
        </div>
      </footer>
    </div>
  )
}
