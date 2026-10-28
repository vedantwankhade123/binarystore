# BinaryStore

React + TypeScript storefront with Firebase Authentication, Firestore Spark, Netlify Functions, Zustand, and Recharts. Outfit is used throughout.

## Current behavior

- Customer sign-in: /login and /register.
- Dedicated seller sign-in: /seller/login, /seller/register, /seller/forgot-password. Both Google and email/password use Firebase Authentication and the same underlying UID. Existing authenticated customers can start their own store without duplicate accounts.
- Sellers verify their email, enroll automatically, and access only their own dashboard, listings, settings, and fulfillment records. No manual approval or sample seller accounts are used.
- Seller dashboard charts and metrics come from saved orders. Empty stores show zero values and empty chart states. Revenue represents delivered orders.
- Seller listings use a green Real badge. Fake Store API samples use a pink Fake badge and are browse-only.
- Checkout accepts Cash on Delivery for seller products. The trusted server validates prices, quantities, stock, seller status, and ownership; creates orders and fulfillment records; and deducts stock transactionally. Card simulation and customer-controlled tracking simulators have been removed.
- Seller fulfillment updates are saved to Firestore and reflected in customer tracking. Sellers arrange delivery and payment collection; there is no payment gateway or courier integration.
- Profile settings, carts, wishlists, addresses, store settings, listings, and orders persist to Firestore. Guest cart/wishlist data is stored locally and merged safely at sign-in.
- Mock accounts and fixture records exist only under tests/fixtures and are never imported into the shipped application. Old simulated orders are excluded from the active order views.
- Existing HTTPS image URLs work. Cloudinary signed uploads, ownership checks, image replacement, deletion, and scheduled orphan cleanup are implemented.

## Run

Use Node 22.18+ in the 22.x release line.

```powershell
npm install
node scripts/setupServerlessEnv.mjs
npm run dev
```

Open http://localhost:5173. The development server runs the same trusted handlers used on Netlify. Private service-account credentials stay in the ignored .env file, never VITE_ variables.

## Verify

```powershell
npm test
npm run test:firebase
npm run test:browser
npm run build
npm run lint
npm run check:frontend-secrets
```

Stop existing Firebase emulators before test:firebase, which starts its own. Browser checks use installed Google Chrome. Integration tests use only demo-shopsphere emulators; no live customer or seller test records are created.

See NETLIFY_SETUP.md for free deployment and FIREBASE_SETUP.md for authentication, rules, and indexes. Keep Firebase on Spark and Netlify on Free. No Firebase Storage or paid upgrade is required.
