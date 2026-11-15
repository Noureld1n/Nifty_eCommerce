// Thin fetch wrapper for the Spring Boot API.
//  - The access token lives in memory only (never localStorage), so XSS cannot read it.
//  - The refresh token is an HttpOnly cookie; the browser sends it, JavaScript never sees it.
//  - ONE refresh at a time: a second concurrent refresh with the same cookie would look
//    like a replayed token to the backend and revoke every session of the user.

const BASE = '' // same origin: Vite proxies /api in dev, a reverse proxy does in production

export class ApiError extends Error {
  constructor(status, message, fieldErrors, retryAfter = 0) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors || null
    this.retryAfter = retryAfter 
  }
}

let accessToken = null
let onSessionExpired = () => {}
let onTokenRefreshed = () => {}

export function setAccessToken(token) { accessToken = token }
export function getAccessToken() { return accessToken }
export function setSessionHandlers({ expired, refreshed }) {
  if (expired) onSessionExpired = expired
  if (refreshed) onTokenRefreshed = refreshed
}

async function parse(res) {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return null }
}

async function raw(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }
  const data = await parse(res)
  if (!res.ok) {
    // 429 = per-IP rate limit or account lockout. Seconds to wait come from Retry-After (or the body).
    const retryAfter = res.status === 429
      ? Math.max(1, Number(res.headers.get('Retry-After')) || Number(data?.retryAfterSeconds) || 60)
      : 0
    const message =
      res.status === 429
        ? `Too many attempts. Try again in ${retryAfter >= 90 ? `${Math.ceil(retryAfter / 60)} minutes` : `${retryAfter} seconds`}.`
        : data?.message || 'Something went wrong. Please try again.'
    throw new ApiError(res.status, message, data?.fieldErrors, retryAfter)
  }
  return data
}

let refreshing = null

/** Exchanges the refresh cookie for a new access token. Safe to call from anywhere at any time. */
export function refreshSession() {
  if (!refreshing) {
    refreshing = raw('/api/public/auth/refresh', { method: 'POST', auth: false })
      .then((data) => {
        accessToken = data.token
        onTokenRefreshed(data)
        return data
      })
      .catch((err) => {
        accessToken = null
        throw err
      })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

export async function request(path, options = {}) {
  try {
    return await raw(path, options)
  } catch (err) {
    // Expired access token: refresh once and retry once. Anything else is the caller's problem.
    if (err.status === 401 && options.auth !== false) {
      try {
        await refreshSession()
      } catch {
        onSessionExpired()
        throw err
      }
      return raw(path, options)
    }
    throw err
  }
}

export const publicPost = (path, body) => request(path, { method: 'POST', body, auth: false })
