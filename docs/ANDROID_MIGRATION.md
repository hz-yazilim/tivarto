# Tivarto Android-only migration

## Product decision
Tivarto's customer-facing product is an Android APK. The existing Next.js/React interface is the visual source of truth and must be preserved rather than redesigned. The existing web experience must not be promoted as a second customer product.

## Initial technical direction
- Keep the current Next.js application on Vercel during the migration. It currently contains server-rendered screens, Server Actions, authentication/session handling, and API routes; removing it before extracting these responsibilities would break the product.
- Keep Supabase PostgreSQL and Prisma. Production data is real and must not be reset, seeded, truncated, or destructively migrated.
- Keep Vercel Blob temporarily because product/store image uploads currently use it. Migrate storage only after a tested replacement and verified object copy.
- Build an Android application shell around the existing UI so the current interface can be reused. Validate cookie/session persistence, file upload, navigation, keyboard, back button, external links, and network-loss behavior on physical Android devices.
- The APK must not expose general browsing or send users to an external browser for normal product use. Any external navigation must be allow-listed.
- Do not disable the production web origin until the Android app, API access, account deletion route, and rollback path have been tested. The web origin may remain as infrastructure while not being a user-facing website.

## Important architecture caveat
The existing app is Next.js 15 with server-rendered routes and Server Actions. It is not a static SPA that can simply be exported into a self-contained Capacitor bundle. A remote WebView shell is the lowest-risk first migration because it preserves current UI and server behavior, but it requires an internet connection and Vercel availability. If a fully self-contained offline APK is later required, server-rendered features must be redesigned as APIs and the client must be bundled locally; that is a larger rewrite.

## Work sequence
1. Preserve main; do all migration work on `android-apk-conversion`.
2. Audit every route, authentication flow, file upload, notification, deep link, and external navigation.
3. Implement Android shell and app-specific navigation/security.
4. Implement account deletion and data deletion with tenant-safe ownership rules, session revocation, storage cleanup, and auditable outcomes.
5. Publish an external account-deletion request page that is not a general web app, as required by Google Play for apps that allow account creation.
6. Complete privacy policy, Data safety disclosures, permissions, SDK inventory, and store listing.
7. Test on emulator and physical Android devices; run production smoke tests without changing live user data.
8. Release through a staged Play internal/closed test before production.

## Non-negotiable safety rules
- Never delete a tenant's records just because one membership/user is deleted.
- Never delete another owner's or staff member's account as a side effect.
- Explain legal retention exceptions (e.g. accounting records) before confirmation and retain only what is legally required.
- Revoke the requesting user's sessions and tokens immediately when deletion is completed.
- Make deletion idempotent, auditable, and resistant to cross-tenant ID manipulation.
- Never claim Play Store compliance until the actual Play Console declarations and review requirements have been completed.
