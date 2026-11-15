# Newtin web

React + Vite front end for the Newtin Spring Boot API.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build
```

Start the API on :8080 (and Mailpit on :8025 for verification / reset emails).

## How it talks to the API

- Vite proxies `/api` to `http://localhost:8080`, so the browser sees one origin.
  No CORS preflights, and the `SameSite=Strict` refresh cookie just works.
  In production, serve the built files and `/api` from the same domain (reverse proxy).
- The access token lives in memory only. The refresh token is the HttpOnly cookie.
- `src/api/client.js` refreshes once at a time (never two in parallel) and retries a 401 once.
- On page load the app calls `/api/public/auth/refresh` to restore the session.

## Layout

```
src/
  api/        client.js (fetch + refresh), authApi.js (all endpoints)
  auth/       AuthProvider, useAuth, route guards (RequireRole, GuestOnly)
  components/ Logo (animated), ui (Button, Field, Alert, ...), AuthCard, Splash
  layouts/    AuthLayout (split apple seam), AppShell (customer + admin frame)
  pages/auth  login, register, check-email, verify-email, forgot/reset password
  pages/user  profile, security, feedback        -> /account/*
  pages/admin users, feedback, audit log         -> /admin/*
```

Brand colours are CSS variables at the top of `src/index.css` (`--leaf`, `--sky`, `--ink`).
