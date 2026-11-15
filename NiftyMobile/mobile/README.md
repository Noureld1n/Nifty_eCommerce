# Nifty mobile

Native customer storefront and admin app for Nifty, built with Expo and React Native.

## Backend API and sessions

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the backend origin only, such as
`https://api.example.com` (no `/api` path). Configure a reachable origin for each simulator or
device environment; do not commit a local machine address or credentials.

For Expo Go on a physical device, use the computer's Wi-Fi IPv4 address rather than `localhost`.
Keep the phone and computer on the same network, allow the backend through the computer's firewall,
and use the backend's reachable port (Spring Boot defaults to `8080` in this project). After
changing `.env`, restart Expo with `npx expo start -c` so the public environment variable is bundled.
For browser testing, run `npm run web` from this project or press `w` in the Expo CLI terminal.
The backend's exact CORS origins are configured through `CORS_ALLOWED_ORIGINS`; the default
development list includes the existing web origin and Expo's localhost web origins. Restart the
backend after changing that setting.

The mobile API client mirrors the web API paths and error handling. It keeps access tokens in
memory and sends requests with cookies enabled so the native networking cookie jar can manage the
backend's `HttpOnly` refresh cookie. It does not copy refresh credentials into app storage. Test
login, token rotation, logout, and app restart behavior on Android and iOS before release. Email
verification and password-reset links currently use the backend's configured web URL; universal
or app-link delivery needs deployment-domain configuration.

## Customer shopping and account flows

The native shop, product details, wishlist, cart and checkout, orders, addresses, profile, security,
payment-method tokens, feedback, and product reviews use the existing web app's API contracts.
Checkout places an order only; online payment is not available, and the UI does not claim that a
payment succeeded. Set a reachable `EXPO_PUBLIC_API_URL` to exercise these flows end to end.

## Admin operations

Admin routes are protected by the `ROLE_ADMIN` session guard and use the existing `/api/admin/**`
contracts for analytics, catalog and variant/image management, promotions, order and shipment
management, procurement, user status, customer feedback, and audit logs. The backend remains the
authorization authority. Changing an order's payment-status record does not process a payment.

## Brand, navigation, and analytics

The shared shell uses the Nifty leaf/sky/ink palette and an animated React Native SVG recreation of
the web apple-and-runner logo; its motion respects the device's reduced-motion setting. Customer
and admin sessions get separate icon-based bottom tabs, with infrequent admin operations grouped
under **More**. The appearance control cycles through system, light, and dark modes and persists the
selection. Shared components and customer/admin screens use the light/dark tokens in `src/theme.ts`.
The admin overview renders the existing analytics API data as a scrollable sales/procurement chart
and visual inventory, order, and supplier rankings.
The finance chart plots paid-sales and procurement values from the API response with labeled
periods and a monetary scale; an all-zero range is called out rather than shown as an unexplained
blank chart.

Current offer slides display the API-provided promotion name, description, percentage or EGP amount,
and selected-products/storewide scope in the server's order. Swiping or tapping Previous/Next moves
between offers on a vertical circular path. Customer and admin top-level pages use the same motion:
swipe left to move to the next tab as the current page travels up and the next page enters from
below; swipe right to reverse the direction. Bottom-tab taps use the same transition. Vertical list
scrolling remains independent.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## UI motion: wheel transition

[`src/components/wheel/WheelPager.tsx`](./src/components/wheel/WheelPager.tsx) implements the
offer-card wheel; [`src/PageWheelTransition.tsx`](./src/PageWheelTransition.tsx) coordinates the
same circular vertical motion across customer and admin tab routes. A left swipe moves the outgoing
page upward and brings the next page up from below; a right swipe reverses the movement. Short
gestures spring back, while accepted swipes and tab taps complete the route change. Offer buttons
use the same transition as offer swipes.

Keep ordinary long-list scrolling vertical, and use the motion only for browsing and navigation.
Checkout and payment feedback must remain tied to the real transaction state: an animation must not
suggest payment succeeded until the server confirms success.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
