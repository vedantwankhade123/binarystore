# Free serverless BinaryStore setup

Use Netlify Free for the frontend and functions, Firebase Spark for Authentication/Firestore, and Cloudinary Free for images. No Firebase Blaze upgrade or separately managed server is required. Netlify Free has a hard monthly credit limit: sites pause when exhausted. Checkout uses Cash on Delivery for seller listings. No online payment gateway is enabled.

## Local development

Use Node 22.18+ in the 22.x release line (.nvmrc specifies 22).

```powershell
Set-Location "D:\Ecommerce Site"
npm install
node scripts/setupServerlessEnv.mjs
npm run dev
```

Open the Vite URL (normally http://localhost:5173). The local Vite middleware runs the same authenticated handlers as Netlify Functions, so seller signup and checkout work with npm run dev. Netlify Dev remains optional: npm run dev:netlify serves the site on localhost:8888. No browser credentials or client-side role writes are used.

The setup helper uses the existing service-account JSON to prepare an ignored local .env. It never prints or uploads credentials. Firebase web configuration remains in .env.local. Local testing never requires publishing the private JSON.

## Deploy

1. Put the source in a private Git repository. Never commit .env, .env.local, the root service-account JSON, or .netlify. They are ignored.
2. In Netlify choose Add new project / Import an existing project, connect the repository, and keep the Free plan. No paid add-ons are needed.
3. The included netlify.toml configures build `npm run build`, publish `dist`, functions `netlify/functions`, and Node 22. Do not drag-and-drop only dist: the function must be built and deployed with the source.
4. Add the environment variables below, then deploy. Redeploy after environment-variable changes.
5. Add your exact Netlify hostname to Firebase Authentication > Settings > Authorized domains (no protocol, port, or path).
6. Publish the entire firestore.rules file and create the two indexes described in FIREBASE_SETUP.md.

### Public build variables

Copy these Firebase WEB values from your existing .env.local into Netlify environment settings. These are public frontend configuration, not Admin credentials:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_USE_EMULATORS=false
```

Do not set FIRESTORE_EMULATOR_HOST or FIREBASE_AUTH_EMULATOR_HOST on the deployed site.

### Private function variables

In Netlify's environment-variable UI set these values from the existing service-account JSON. Ensure they are available to Functions (or all scopes if your plan does not offer per-scope controls):

| Variable | JSON field |
| --- | --- |
| FIREBASE_ADMIN_PROJECT_ID | project_id (binarystore-18da7) |
| FIREBASE_ADMIN_CLIENT_EMAIL | client_email |
| FIREBASE_ADMIN_PRIVATE_KEY | private_key, including BEGIN/END lines |

Paste the private key only into Netlify's private environment settings. Never paste it into chat, source code, netlify.toml, or a variable beginning VITE_. Actual line breaks and literal backslash-n escapes are both supported. Do not add surrounding quotes in Netlify's UI. The helper's local .env stays on your computer.

In Google Cloud IAM for binarystore-18da7, ensure that principal has Cloud Datastore User (roles/datastore.user) and Firebase Authentication Admin (roles/firebaseauth.admin). These are trusted backend permissions, not website seller roles. No new key, Google Cloud Functions runtime, Storage setup, or Cloud Run deployment is needed.

Admin SDK calls bypass Firestore rules. The server verifies Firebase ID tokens (including revocation/disabled-account checks), derives identity from that token, reprices orders from trusted catalog data, and enforces ownership. Server credentials must remain private.

## API and seller flow

One deployed function, netlify/functions/shop-api.ts, exposes authenticated JSON POST endpoints:

| Endpoint | Action |
| --- | --- |
| /api/enrollSeller | Automatically enable the caller's store after email verification |
| /api/createOrder | Reprice items, check stock/cart quantities, create an idempotent order and reduce stock |
| /api/updateFulfillment | Advance only the owning seller's delivery status one step |

Become a seller > /seller/login or /seller/register > verify email > automatic enrollment > dashboard. There is no administrator approval step. The legacy approved field means enabled store and is assigned by the server. Clients cannot modify seller claims, enabled flags, or suspension. Suspended accounts cannot re-enable themselves.

## Catalog and verification

Fake Store API samples remain available to browse and are labeled Fake in pink. They cannot be ordered. Publish seller-created products through the seller dashboard; they appear in the storefront with a green Real badge and can be ordered with Cash on Delivery. No sample catalog seeding is required.

```powershell
npm test
npm run test:firebase
npm run lint
npm run build
npm run check:frontend-secrets
```

Integration tests start their own Auth and Firestore emulators and call the actual Netlify Request/Response handler. Stop an existing emulator session first. No live accounts or database records are created by tests.

After deployment verify login/logout, automatic seller enrollment, seller listing creation, checkout/cart clearing, customer order history, seller delivery updates, and denied cross-user access. Cloudinary signed uploads are supported; configure the three server-only CLOUDINARY_* variables below. No paid service or live deployment was enabled by the conversion.

References: https://docs.netlify.com/build/functions/overview/ and https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/

Saved addresses and product specifications are limited to 10 each (images remain 6) so valid maximum-sized documents stay within Firestore rules evaluation limits. The frontend reports these limits before saving.
