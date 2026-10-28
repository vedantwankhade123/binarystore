# BinaryStore

A full-stack ecommerce storefront and seller dashboard built with React, TypeScript, Firebase, Cloudinary, and Netlify Functions.

[Live demo](https://binarystore.netlify.app) · [Deployment verification](DEPLOYMENT_CHECKS.md)

## Features

- Email/password and Google authentication with secure account linking.
- Customer profiles, saved addresses, wishlists, carts, and order history.
- Seller registration, email verification, store settings, product management, and sales charts based on persisted orders.
- Signed Cloudinary image uploads with ownership checks and scheduled cleanup.
- Cash on Delivery checkout with server-validated prices, transactional inventory updates, and duplicate-order protection.
- Seller fulfillment updates reflected in customer order tracking.
- Green **Real** badges for seller listings; pink **Fake** badges for browse-only Fake Store API samples.
- Responsive layouts and Outfit typography.

Online payments and courier integrations are not included. Some footer help/company links still need dedicated content; see [remaining launch checks](DEPLOYMENT_CHECKS.md#remaining-launch-checks).

## Requirements

- Git and Node.js **22.18+ in the 22.x release line**, including npm (`.nvmrc` specifies 22).
- Your own Firebase project with Authentication and a Firestore database.
- Your own Cloudinary account for product image uploads.
- Java 21+ for Firebase emulator tests; Google Chrome for browser tests.
- A Netlify account if you want to deploy the frontend and API functions together.

Use your own cloud projects and credentials. The public demo's private configuration is not included.

## 1. Clone and install

Fork this repository on GitHub if you want to push your own changes, then clone your fork. To try the original locally:

```sh
git clone https://github.com/vedantwankhade123/binarystore.git
cd binarystore
npm ci
```

`npm ci` installs the versions recorded in the lockfile.

## 2. Configure Firebase

1. Create a Firebase project and register a **Web app** in Project settings. Copy its web configuration.
2. Create a **Cloud Firestore** database in Native mode.
3. Enable **Email/Password** and **Google** under Authentication → Sign-in method. Configure Google's support email.
4. In Authentication → Settings → Authorized domains, add `localhost`, `127.0.0.1`, and later your deployed hostname. Keep the Firebase auth domain. Enter hostnames without protocol or paths.
5. Keep one account per email enabled so Google and password sign-in can be linked securely.
6. In Project settings → Service accounts, generate a private Admin SDK key for your own project. Store it outside the repository, or inside the ignored `secrets/` folder. Never put it in `public/` or `src/`.

Publish this repository's rules and indexes to **your** project:

```sh
npx firebase login
npx firebase deploy --only "firestore:rules,firestore:indexes" --project YOUR_FIREBASE_PROJECT_ID
```

Wait for the indexes to become ready. The rules intentionally deny direct browser writes to products, stock, and orders; the trusted API handles those operations. Do not loosen the rules to fix a missing server credential.

The server service account needs Firestore data access and Firebase Authentication administration, typically `roles/datastore.user` and `roles/firebaseauth.admin`. The CLI deployment account also needs permission to publish rules/indexes. Firebase Storage and Firebase Cloud Functions are not required by this project.

## 3. Create your local environment file

Copy the safe template into a private local file:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
```

Fill in `.env` using your own values:

| Variable | Where to get it |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase Web app configuration: `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Web app configuration: `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Web app configuration: `projectId` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Web app configuration: `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Web app configuration: `appId` |
| `VITE_FIREBASE_USE_EMULATORS` | `false` for your real Firebase project |
| `FIREBASE_ADMIN_PROJECT_ID` | Private service-account JSON: `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Private service-account JSON: `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private service-account JSON: `private_key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account configuration |
| `CLOUDINARY_API_KEY` | Cloudinary API credentials |
| `CLOUDINARY_API_SECRET` | Cloudinary API credentials |

Keep the private key quoted on a single line with escaped newlines:

```dotenv
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
```

The Firebase web project and Admin service account must refer to the same project. `.env.local`, if you create one, overrides `.env`; check it for old values when switching projects.

**Every `VITE_` value is exposed in the browser bundle.** Use that prefix only for public web configuration, never Admin keys or Cloudinary secrets. Do not copy secrets into source code, screenshots, issues, or `netlify.toml`.

Only `.env.example` (blank placeholders) and `.env.emulator` (local demo switches) are committed. Real `.env`, `.env.local`, other private environment files, `.netlify/`, and service-account keys are ignored.

> The optional `setupServerlessEnv.mjs`, `serverApp.mjs`, and scripts that use it currently validate the original demo project ID. For your own project, use the manual environment setup above. Do not run those maintenance scripts against someone else's project; adapt their project validation deliberately if you need them. Normal app development and deployment read your configured environment variables.

## 4. Start the app

```sh
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. The development server includes `/api/*` handlers, so you do not need a separate backend process. Restart Vite after changing environment variables.

To try the complete flow:

1. Register a customer account, verify your email, and log in.
2. Visit `/seller/register` to create a store, or use the existing account through `/seller/login`. Complete email verification to enroll as a seller.
3. Add a product with stock and an uploaded image, then publish it.
4. Find the listing in `/shop`, add it to your bag, and complete Cash on Delivery checkout.
5. Update fulfillment in the seller dashboard and check the customer's order page.

A new store starts with empty analytics. Fake Store samples are browse-only and cannot be checked out.

## 5. Run checks

```sh
npm run lint
npm test
npm run build
npm run check:frontend-secrets
```

Firebase integration tests start isolated Auth and Firestore emulators under the fixed **demo-shopsphere** test project; they do not need your production Admin key:

```sh
npm run test:firebase
```

Stop any existing emulators on ports `8080` and `9099` before running that command. To run only the security-rule suite, use `npm run test:rules`.

Browser startup checks use installed Google Chrome and start/reuse a local Vite server. Your local Firebase web configuration must be present:

```sh
npm run test:browser
```

For interactive emulator development, run `npm run emulators` in one terminal. In a second terminal set the server emulator variables before starting the frontend:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
$env:FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099'
$env:GCLOUD_PROJECT='demo-shopsphere'
npm run dev:emulator
```

On macOS/Linux, use `export NAME=value` for those three variables. The committed `.env.emulator` enables the frontend emulators. Keep the web config fields populated (dummy values are sufficient for the demo project). Never enable emulator variables on production. Cloudinary remains an external service: the optional live-image/browser scripts upload actual images and require your Cloudinary credentials.

`npm run preview` serves the built frontend only; use Vite development or Netlify for API-backed operations.

## 6. Deploy your own copy on Netlify

1. Push your fork to GitHub and import it into Netlify for automatic deployments, or link it with the Netlify CLI.
2. Keep the settings from `netlify.toml`: build command `npm run build`, publish directory `dist`, functions directory `netlify/functions`, and Node 22.
3. Add the variables from the table to Netlify's environment settings. Public `VITE_FIREBASE_*` values must be available during builds. Private `FIREBASE_ADMIN_*` and `CLOUDINARY_*` values must be available to Functions. If scope controls are unavailable, use all scopes. Do not commit the values.
4. Set `VITE_FIREBASE_USE_EMULATORS=false`. Do not set `FIRESTORE_EMULATOR_HOST` or `FIREBASE_AUTH_EMULATOR_HOST` on the deployed site.
5. Add your exact Netlify hostname to your Firebase project's authorized domains.
6. Publish your Firestore rules/indexes, deploy, and verify login, uploads, listing creation, checkout, and fulfillment on the live hostname.

For a manual CLI deployment:

```sh
npx netlify login
npx netlify link
npx netlify deploy --prod --context production
```

Create a Netlify project first if there is none to link. Set the hosting environment variables before deploying. The command builds and deploys both the frontend and functions; uploading only `dist` will omit the backend. Manual deployments do not automatically configure GitHub continuous deployment.

See [Netlify setup](NETLIFY_SETUP.md) and [Firebase setup](FIREBASE_SETUP.md) for implementation details. Those historical notes reference the original project; substitute your own project IDs, hostnames, and credentials.

## Project structure

```text
src/                 React pages, layouts, components, state, and client services
server/              Trusted auth, order, product, and media operations
netlify/functions/   Deployed API entry points and scheduled image cleanup
public/              Public images and static assets; never store secrets here
scripts/             Maintenance and optional integration verification helpers
tests/               Unit, Firebase emulator, and browser tests
firestore.rules      Database access rules
firestore.indexes.json
netlify.toml         Build, function, and routing configuration
```

## Troubleshooting

| Problem | Check |
| --- | --- |
| Missing Firebase web configuration | Populate the `VITE_FIREBASE_*` variables and restart Vite. |
| `auth/unauthorized-domain` | Add the current hostname to your Firebase authorized domains. |
| API returns 503 | Check server-only Admin variables, matching project IDs, IAM permissions, and function logs. |
| Uploads fail | Check all three server-only Cloudinary values; use a verified seller and JPG/PNG/WebP up to 8 MB. |
| Permission denied | Deploy the supplied rules; sign in and verify the email. Product/order writes must go through the API. |
| Query requires an index | Deploy `firestore.indexes.json` and wait until indexes are ready. |
| Emulator ports are occupied | Stop the existing emulator session before running the integration suite. |
| Deep links return 404 after deployment | Deploy with the included Netlify redirect configuration. |
| Changes do not appear after a push | Configure Git continuous deployment or run a new manual deployment. |

Before sharing your copy, replace the demo branding/content as needed, complete help and policy pages, and verify your own Google sign-in flow and cloud service limits.
