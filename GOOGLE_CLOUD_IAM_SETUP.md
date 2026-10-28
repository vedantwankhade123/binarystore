# IAM for Firebase Spark and Netlify Functions

See NETLIFY_SETUP.md for deployment. Firebase Blaze, Google Cloud Functions deployment roles, and a Google function runtime account are not required.

In Google Cloud Console > IAM & Admin > IAM, select binarystore-18da7. Find the principal matching client_email in the existing ignored service-account JSON. Ensure this backend principal has:

- Cloud Datastore User (roles/datastore.user): server-side Firestore transactions.
- Firebase Authentication Admin (roles/firebaseauth.admin): session validation, account checks, and seller custom claims.

Store the private key only in Netlify's private FIREBASE_ADMIN_PRIVATE_KEY variable. Never put it in frontend code or VITE_ variables. Do not create a new key unnecessarily.

CLI index deployment separately requires Cloud Datastore Index Admin (roles/datastore.indexAdmin) and Service Usage Consumer (roles/serviceusage.serviceUsageConsumer) for the deploying principal. If you create indexes manually with your administrator account, this additional service-account setup is unnecessary.

Sellers enroll automatically after email verification through Netlify. There is no manual approval. These Google Cloud IAM roles belong to the trusted backend, not website sellers.
