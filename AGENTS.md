# Project design preferences

- The website brand is BinaryStore. Use this exact capitalization in all user-facing branding and copy.

- Use Outfit for all website typography, including headings, body text, branding, and form controls.
- Do not add decorative eyebrow text, uppercase marketing labels above section headings, filler taglines beside navigation, or decorative editorial labels on images. The user explicitly requested their removal; keep future development free of these elements.
- Keep useful labels such as product categories, prices, discount badges, navigation links, and accessible control names.
- Login and signup must use the standalone AuthLayout: shopping imagery on the left and the form on the right on desktop, stacked on mobile. Do not render the storefront header, announcement bar, or footer on auth routes.
- Keep auth pages within the viewport at standard desktop/mobile sizes. Place Back to shopping over the top-left of the shopping image with a high-contrast background.

- Do not require a complete-profile screen after Google or email/password signup/login. Profile photos, optional phone, preferences, and sign-in methods belong in /profile settings. Both providers must share a Firebase UID through secure account linking.

- Seller auth uses /seller/login and /seller/register with Firebase, not mock accounts. Dashboard charts and statistics must use the seller's persisted data. Fake Store samples have pink/white Fake badges and are browse-only; seller listings have green/white Real badges. Orders currently use Cash on Delivery, with no card or tracking simulator.
