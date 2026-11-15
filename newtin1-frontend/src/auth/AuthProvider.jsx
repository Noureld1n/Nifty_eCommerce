import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/authApi'
import { refreshSession, setAccessToken, setSessionHandlers } from '../api/client'
import { AuthContext } from './authContext'

// Refresh this many seconds before the access token expires, so users never hit a 401 mid-click.
const REFRESH_MARGIN_S = 30

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true) // true until we know whether a session cookie exists
  const [notice, setNotice] = useState('')
  const timer = useRef(null)

  const clear = useCallback(() => {
    clearTimeout(timer.current)
    setAccessToken(null)
    setUser(null)
  }, [])

  const schedule = useCallback((expiresIn) => {
    clearTimeout(timer.current)
    const ms = Math.max((expiresIn - REFRESH_MARGIN_S) * 1000, 5000)
    timer.current = setTimeout(() => {
      refreshSession().catch(() => {}) // failure is reported through the session handler path on the next request
    }, ms)
  }, [])

  const apply = useCallback((data) => {
    setUser(data.user)
    schedule(data.expiresIn)
  }, [schedule])

  useEffect(() => {
    setSessionHandlers({
      refreshed: apply,
      expired: () => { clear(); setNotice('Your session ended. Please log in again.') },
    })
    // Restore the session from the HttpOnly cookie on page load.
    // refreshSession() is single-flight, so React StrictMode's double effect cannot send two.
    refreshSession()
      .catch(() => {}) // no cookie / expired cookie just means "logged out"
      .finally(() => setBooting(false))
    return () => clearTimeout(timer.current)
  }, [apply, clear])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setAccessToken(data.token)
    setNotice('')
    apply(data)
    return data.user
  }, [apply])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* the cookie is cleared server-side when reachable; clear locally regardless */ }
    clear()
  }, [clear])

  /** After a password change the backend revokes every session, so we end this one too. */
  const endSession = useCallback((message) => { clear(); setNotice(message || '') }, [clear])

  const value = useMemo(
    () => ({ user, booting, notice, setNotice, login, logout, endSession, setUser }),
    [user, booting, notice, login, logout, endSession],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
