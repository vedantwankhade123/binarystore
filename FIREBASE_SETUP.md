# Firebase Spark setup

Trusted operations now run on Netlify Functions. See NETLIFY_SETUP.md for the complete free deployment process. Do not upgrade to Blaze or deploy Firebase Cloud Functions.

1. Enable Email/Password and Google in Authentication > Sign-in method. Select Google's support email.
2. In Authentication > Settings > Authorized domains, keep binarystore-18da7.firebaseapp.com, binarystore-18da7.web.app, localhost, 127.0.0.1, and your actual Netlify hostname. Add hostnames separately without protocol, port, or path.
3. Publish the ENTIRE firestore.rules file in Firestore Database > Rules.
4. In Firestore Database > Indexes > Composite, create these Collection-scope indexes:

| Collection | Fields |
| --- | --- |
| products | status Ascending, category Ascending |
| reviews | productId Ascending, status Ascending |

Wait until both are Enabled. No manual __name__ field is needed.

With an authorized CLI account you can instead run:

```powershell
npx firebase login
npx firebase deploy --only "firestore:rules,firestore:indexes" --project binarystore-18da7
```

Rules keep profiles, carts, wishlists, and customer orders private; restrict unpublished products to their seller; and deny browser writes to orders and fulfillment. Netlify creates seller profiles automatically after email verification. Users cannot self-assign claims or enabled/suspension flags. The approved field is an internal enabled-store flag, not a manual approval workflow.

Firebase Storage is not used. Cloudinary signed uploads are implemented; configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET only in server environment variables. Existing HTTPS image URLs remain supported. Netlify deployment and server credentials are documented in NETLIFY_SETUP.md.

## Unified sign-in and optional profile settings

Google and password signup now go straight to the requested page or storefront. Profile completion is not required; /auth/complete-profile redirects to /profile#settings for old links. Photos, optional phone, preferences, connecting Google, and adding/changing a password are available from account settings. HTTPS image URLs work now; Cloudinary product image uploads use authenticated server signatures.

The live project was checked: signIn.allowDuplicateEmails is false. Keep Firebase Authentication > Settings > User account linking set to one account per email (link accounts using the same email). Firebase can automatically recognize trusted Google identities. If another credential must first be verified, sign in using the existing password; the app links the pending Google credential only after authentication and only for the matching email. The pending credential lives in memory, not browser storage. Existing profile/cart/order records remain under the same UID. Google-first users can add a password in Settings. Email verification requirements for checkout and seller enrollment remain in force.

No browser-side merge by email or privileged role changes are used. Already-created separate UIDs are not merged automatically. Provider linking is covered with Auth emulator tests confirming the UID and saved profile/cart remain unchanged.

## Seller database and real orders

The dedicated seller routes are /seller/login and /seller/register. Store documents live at sellerProfiles/{uid}; products carry ownerId; sellerFulfillments carry sellerId and the relevant items/customer delivery information. All subscriptions are scoped to the signed-in seller. Listings, stock, settings, orders, and delivery updates are persisted in Firestore.

Dashboard metrics are calculated from those records, with delivered-order revenue and actual monthly activity. No mock seller records are loaded. Fake Store samples remain clearly labeled and cannot create orders. The createOrder Netlify handler only accepts Cash on Delivery and seller-source catalog documents. The former tracking simulator endpoint has been removed.

The existing firestore.rules already enforce these ownership boundaries; this phase does not require a new rules deployment. Redeploy the updated source on Netlify for production behavior to change. Delivery arrangement and payment collection are handled by the seller; online payments and courier integrations are not included.
