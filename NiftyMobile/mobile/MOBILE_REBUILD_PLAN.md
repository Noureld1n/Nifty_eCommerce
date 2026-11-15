# Mobile e-commerce app plan

## Goal and scope

Build a native e-commerce app in `NiftyMobile/mobile` that follows both the customer storefront/account experience and the admin portal in `newtin1-frontend`. Keep the React web app as a separate web product. Support both `ROLE_CUSTOMER` and `ROLE_ADMIN` in mobile, with role-appropriate navigation and access.

The web app's existing API modules are the source of truth for endpoint paths, request payloads, and response behavior. The mobile app must use those existing backend APIs; it must not replace real calls with mock data or invent parallel endpoints. Reuse transport-independent service code where the project setup allows it, and adapt only the platform-specific networking and session handling.

## Phase 1 — Map both roles and their web experiences (completed)

- Map all routes in [`App.jsx`](../../newtin1-frontend/src/App.jsx) and role navigation in [`navigationLinks.js`](../../newtin1-frontend/src/layouts/navigationLinks.js). Customer scope: shop/products, authentication, wishlist, cart/checkout, addresses, orders, profile, security, payment methods, feedback, and reviews. Admin scope: analytics, catalog/categories/products/variants/images, promotions, orders/shipments, procurement/stock, users, feedback, and audit logs.
- Use the web app's leaf/sky/ink palette, typography, rounded controls, product imagery, badges, and clear loading, empty, and error states as visual references. Recreate them with React Native components and styles rather than trying to render web DOM or copy CSS.
- Establish the Expo Router route and navigation map for both roles. Keep admin routes protected for `ROLE_ADMIN` and customer routes protected for `ROLE_CUSTOMER`; the backend remains the authorization authority.
- Treat the existing arc-swipe animation in [`src/components/wheel/WheelPager.tsx`](./src/components/wheel/WheelPager.tsx) as a reusable transition pattern. Use it where a horizontal swipe naturally changes between adjacent, browsable content—such as featured collections or product-gallery items. Keep vertical scrolling and accessibility usable, and do not use the motion to imply that an order or payment succeeded.
- The route, role, screen, visual, and animation mapping is recorded in [`MOBILE_UX_MAP.md`](./MOBILE_UX_MAP.md). Phase 1 is complete; screen/API implementation remains in Phases 2–4.

## Phase 2 — Build the mobile foundation, role access, and API connection

**Progress:** The native shell, shared UI primitives, role-gated route scaffolding, API transport, and auth/session flows are implemented. Runtime requests against public, customer, and admin endpoints and refresh-cookie persistence still need verification on a reachable backend and Android/iOS builds; the local backend was not listening during this implementation.

- Create the shared mobile shell, theme tokens, reusable buttons, fields, cards, alerts, and loading/empty/error patterns. Add sign-in/session state and role-aware customer/admin navigation and landing routes.
- Reuse the web API definitions in [`src/api/`](../../newtin1-frontend/src/api/) as the implementation reference (and share the endpoint-specific functions if they can be consumed cleanly by both apps). Keep backend paths, methods, payload shapes, pagination, and error semantics consistent; do not port React pages or browser-only hooks.
- Adapt the API transport for a physical device or emulator: the web client's empty same-origin base URL and Vite proxy are not available to the mobile app. Configure a deploy/environment-specific API origin without hard-coding a machine address.
- Preserve the web client's authentication behavior where compatible: access tokens are short-lived and held in memory; refresh is single-flight; authenticated requests retry once after refresh. Verify how the backend's HttpOnly refresh cookie works with native requests and use an appropriate secure, supported mobile session strategy rather than storing refresh credentials in plain app storage.
- Wire the existing auth APIs for register, login, logout, session refresh, email verification, and password recovery. Restore the signed-in user and role so navigation and screens follow the web app's authorization rules. Confirm public, customer, and admin requests against the existing backend before building dependent screens.
- The mobile equivalents of the web auth endpoints are in [`src/api/authApi.ts`](./src/api/authApi.ts), using the single-flight, one-retry transport in [`src/api/client.ts`](./src/api/client.ts). Set `EXPO_PUBLIC_API_URL` as described in [`README.md`](./README.md); the refresh token remains an `HttpOnly` cookie and is not copied into app storage.

## Phase 3 — Implement customer shopping and order flows (implementation complete)

**Progress:** The customer storefront and account workflows now use the native API modules and shared loading, error, and empty states. Type-check, lint, and Android JavaScript bundling pass. End-to-end API behavior and iOS/Android device behavior remain unverified until the backend is reachable with `EXPO_PUBLIC_API_URL` configured.

- Build the shop landing and collection screens using `catalogApi` for categories, paginated products, product details, and promotions. Adapt web filters/search and product-card information to touch-friendly layouts.
- Build product details with variant selection, imagery, pricing/stock, reviews, and add-to-cart behavior. Use `reviewApi` and `wishlistApi` for review summaries/lists and customer wishlist state; preserve their public-versus-authenticated access rules.
- The shop uses API-backed categories, product types, page navigation, current offers, product cards, and in-page search. The arc-swipe pager is used for multiple current offers and includes accessible page controls; the pager's visual state remains separate from catalog and cart data.
- Implement wishlist, profile, addresses, saved payment-method display, security, and feedback using the existing `wishlistApi`, `userApi`, and `addressApi` functions.
- Implement cart loading, quantity changes, item removal, and clear-cart with `cartApi`. Build checkout from the existing shipping/billing address selection and call `cartApi.checkout(shippingAddressId, billingAddressId)`; do not add a separate mobile checkout endpoint.
- Implement order history, order details, shipment information, and cancellation using `orderApi`. Refresh or navigate to the order returned by checkout instead of treating a local animation as proof that an order exists.
- Preserve the web app's current payment semantics: checkout places an order, but online payment is not available yet. Say that clearly in the UI and never show a payment-success state. If an order-placement confirmation animation is added later, show it only after the checkout API returns success and describe it as an order confirmation, not a payment confirmation.
- The native screens cover wishlist, profile, password changes, addresses, saved payment-method tokens, feedback, cart/checkout, orders/shipment/cancellation, product reviews, and catalog/product details. Payment method UI accepts provider tokens only and does not collect full card numbers.
- Still validate with a reachable backend and on devices: real catalog data, pagination, unavailable images, out-of-stock variants, session expiry, refresh-cookie behavior, checkout, and API error/retry states.

## Phase 4 — Implement admin operations and verify both roles

**Progress:** The native admin API wrappers and role-protected screens are implemented for the overview, catalog, promotions, orders, procurement, users, customer feedback, and audit log. Admin operations use the existing `/api/admin/**` contracts. Type-check, lint, Android bundle export, and diff checks pass. Live backend and device journeys still require a configured API origin.

- Build a role-protected admin mobile area that adapts the web admin screens to phone-friendly lists, filters, forms, and detail views rather than shrinking wide desktop tables. Cover analytics; category/product/variant/image management; promotions; order and shipment management; procurement providers/accountables/package receiving; user status; customer feedback; and audit-log filters.
- Use the existing `adminAnalyticsApi`, `adminCatalogApi`, `adminPromotionApi`, `adminOrderApi`, and `adminProcurementApi` from `adminCommerceApi.js`, plus `adminApi` from `authApi.js`. Keep admin operations on their current `/api/admin/**` routes and use backend authorization for every privileged action.
- The native admin screens provide analytics ranges and historical periods; category and product filters; category/product/variant/image maintenance; promotion create/edit/activation; order/payment/shipment status updates; provider/accountable maintenance and stock receipt; user detail/status controls; feedback filters; and audit filters.
- The admin overview now uses a scrollable sales-versus-procurement chart, colored business metrics, and visual inventory, order-status, and supplier rankings, all backed by the existing analytics response.
- Locally validate the mobile type-check, lint, and Android bundle. Still verify complete customer and admin journeys on Android and iOS against a reachable backend: role-based access, session expiry, API errors, accessibility, and animation behavior.
- Keep online-payment semantics unchanged: customer checkout creates an order but does not process a payment. Admin payment-status edits update the backend record only and do not process a payment.

## Existing API inventory to use

| Web API module | Mobile use (customer + admin) |
| --- | --- |
| [`catalogApi.js`](../../newtin1-frontend/src/api/catalogApi.js) | Public categories, paginated products, product detail, and promotions (`/api/public/**`). |
| [`authApi.js`](../../newtin1-frontend/src/api/authApi.js) | Public auth flows; customer profile, password, feedback, payment methods, and `me`; admin user status, feedback, and audit logs (`/api/public/auth/**`, `/api/user/**`, `/api/admin/**`). |
| [`customerCommerceApi.js`](../../newtin1-frontend/src/api/customerCommerceApi.js) | Wishlist, addresses, cart/checkout, orders/shipment/cancellation, and product reviews (`/api/user/**`, plus public review reads). |
| [`adminCommerceApi.js`](../../newtin1-frontend/src/api/adminCommerceApi.js) | Admin analytics, catalog and variant/image management, promotions, order/payment/shipment management, and procurement (`/api/admin/**`). |
| [`client.js`](../../newtin1-frontend/src/api/client.js) | Existing fetch/error/token-refresh behavior. Reuse its behavior as appropriate, while adapting the browser-specific origin and refresh-cookie transport for React Native. |
