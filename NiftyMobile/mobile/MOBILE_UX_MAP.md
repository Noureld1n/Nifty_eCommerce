# Mobile UX and navigation map

This is the Phase 1 mapping deliverable for the native app in `NiftyMobile/mobile`. It translates the React web routes and role navigation into phone-sized flows; it does not yet migrate screens or API code.

## Entry and access rules

| State | Mobile destination | Web behavior |
| --- | --- | --- |
| App starts while session is loading | Branded loading state | `RootRedirect` waits for auth boot |
| Signed out | Shop | `/` redirects to `/shop` |
| `ROLE_CUSTOMER` | Shop; account features use customer navigation | `homeFor` sends non-admin users to `/shop` |
| `ROLE_ADMIN` | Admin overview | `/` redirects to `/admin`, then `/admin/analytics` |

- Keep shop and product browsing public. Show customer-only actions such as wishlist, cart, and checkout only when the customer is signed in; direct attempts to customer screens should lead through sign-in and return to the requested screen where supported.
- Resolve role from the authenticated backend session, not a user-selected role. Gate customer and admin route groups in the app, and continue treating backend authorization as authoritative for every API request.
- Use the same login, registration, verification, and password-recovery flows for both roles. After sign-in, route to the destination appropriate to the returned role.
- Admins may browse the public shop, as the web navigation allows, but must not receive customer-account privileges merely because they can browse it.

## Customer screen map

The suggested mobile primary navigation is **Shop**, **Wishlist**, **Cart**, **Orders**, and **Account**. Use a stack for details and forms; keep the cart visible as a primary destination rather than a desktop-style drawer.

| Web route / source | Mobile destination and interaction | Existing API source |
| --- | --- | --- |
| `/shop` — `ShopPage` | Shop tab: promotion highlights, category/search/filter controls, paginated product cards | `catalogApi` |
| `/shop/products/:id` — `ProductDetailPage` | Product detail: image gallery, variants and availability, price, reviews, wishlist and add-to-cart actions | `catalogApi`, `reviewApi`, `wishlistApi`, `cartApi` |
| `/account/wishlist` — `WishListPage` | Wishlist tab: saved products, remove and open product | `wishlistApi` |
| `/account/cart` — `CartPage` | Cart tab: quantities, removal, clear cart, totals, proceed to checkout | `cartApi` |
| Checkout flow in cart | Select shipping and billing addresses, review order, then place it | `addressApi`, `cartApi.checkout(shippingAddressId, billingAddressId)` |
| `/account/orders` — `OrdersPage` | Orders tab: order history and status summaries | `orderApi` |
| `/account/orders/:id` — `OrderDetailPage` | Order detail: items, shipment, status, and eligible cancellation | `orderApi` |
| `/account` and `/account/profile` — `ProfilePage` | Account landing/profile editor | `userApi` |
| `/account/addresses` — `AddressesPage` | Address list and add/edit/default-address flows | `addressApi` |
| `/account/payments` — `PaymentMethodsPage` | Saved payment-method display and supported management actions | `userApi` |
| `/account/security` — `SecurityPage` | Password/security actions | `userApi` |
| `/account/feedback` — `FeedbackPage` | Submit and review customer feedback | `userApi` |
| Product detail reviews | Review list, summary, and eligible review form | `reviewApi` |

Keep the current payment semantics: checkout creates an order but does not process an online payment. Show order confirmation only after the checkout API returns success; never label it payment success.

## Admin screen map

Use an admin-only shell with an icon-based bottom navigation for **Overview**, **Catalog**, and **Orders**, plus a **More** destination for less-frequent operations. Keep public **Shop** available as a separate destination. Each dense web table should become a searchable/filterable list with a separate detail or edit screen; avoid shrinking desktop tables to phone width.

| Web route / source | Mobile destination and interaction | Existing API source |
| --- | --- | --- |
| `/admin` and `/admin/analytics` — `AdminAnalyticsPage` | Overview: sales/procurement summaries, range selection, stock/provider insights | `adminAnalyticsApi` |
| `/admin/catalog` — `AdminCatalogPage` | Catalog: category and product lists/filters; guided product, variant, and image create/edit flows | `adminCatalogApi` |
| `/admin/promotions` — `AdminPromotionsPage` | Promotions: list, create/edit, activate/deactivate, target categories/products | `adminPromotionApi`, `adminCatalogApi` |
| `/admin/orders` — `AdminOrdersPage` | Orders: status/payment filters, order detail, fulfillment/payment status and shipment updates | `adminOrderApi` |
| `/admin/procurement` — `AdminProcurementPage` | Procurement & stock: provider/accountable management, package receipts and receipt lines | `adminProcurementApi`, `adminCatalogApi` |
| `/admin/users` — `UsersPage` | Users: search/list and supported user-status action | `adminApi` |
| `/admin/feedback` — `AdminFeedbackPage` | Customer feedback: review and manage submissions | `adminApi` |
| `/admin/audit-log` — `AuditLogPage` | Audit log: filter and inspect records | `adminApi` |

The admin shop link remains public browsing only. Admin actions stay behind the admin route gate and use `/api/admin/**` operations; do not infer authorization from a hidden button.

## Visual translation

- Carry the web app's core palette into native theme tokens: leaf `#9be3b8`, sky `#9cd3f5`, ink/text `#12161c`, muted text `#566470`, surface `#ffffff`, line `#dce5e9`, success `#1d6a43`, and danger `#b3261e`. The native shell carries the leaf/sky accent into its header and bottom tabs, and admin metrics and charts use distinct palette colors. Light and dark tokens follow the web stylesheet's overrides; the appearance control supports system, light, and dark modes and persists the user's selection.
- Use the web typography declarations as references: Bricolage Grotesque for display and Figtree for body text, with native/system fallbacks if font assets are not available. `src/components/BrandLogo.tsx` recreates the animated Nifty apple-and-runner SVG with React Native SVG and respects the device's reduced-motion setting.
- Preserve the storefront's light, spacious feel, leaf/sky accent gradients, rounded controls/cards, prominent product photography, sale/stock badges, and clear price hierarchy. Adapt the web product grid to a compact native grid/list and use native image loading/fallback behavior.
- Use native form controls, safe areas, accessible touch targets, and platform back behavior. Admin lists should emphasize status, customer/product identity, and the next action, with filters and edit forms moved into focused screens.
- Render admin analytics as touch-friendly visual charts and ranked bars using the existing dashboard response; keep the period and range controls connected to the same analytics API.
- Every data-backed screen needs distinct loading, empty, error/retry, and success feedback. Server responses remain the source of truth; do not create success-shaped local fallbacks.

## Wheel transition

`src/PageWheelTransition.tsx` coordinates circular vertical transitions between customer and admin
top-level tab routes; `src/components/wheel/WheelPager.tsx` applies the same motion to current-offer
cards. A left swipe moves the current page upward and the next page enters from below; a right swipe
reverses the movement. Bottom-tab selection and offer Previous/Next controls use the same animated
path. Horizontal gestures must fail when vertical scrolling takes over. Keep the pager's accessible
controls, and do not use this browsing/navigation motion as checkout, payment, order-status, or
admin-mutation confirmation. Any confirmation must be tied to the corresponding successful API
response.

## Source references

- Web route guards and route-to-page mapping: `../../newtin1-frontend/src/App.jsx`, `../../newtin1-frontend/src/auth/RouteGuards.jsx`
- Role navigation and shared shell: `../../newtin1-frontend/src/layouts/navigationLinks.js`, `../../newtin1-frontend/src/layouts/AppNavigation.jsx`
- Web palette and typography declarations: `../../newtin1-frontend/src/index.css`
- API contract reference: `../../newtin1-frontend/src/api/catalogApi.js`, `../../newtin1-frontend/src/api/authApi.js`, `../../newtin1-frontend/src/api/customerCommerceApi.js`, `../../newtin1-frontend/src/api/adminCommerceApi.js`
- Native animation reference: `src/components/wheel/WheelPager.tsx`
