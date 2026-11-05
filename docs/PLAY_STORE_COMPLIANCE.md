# Google Play policy and privacy release gate

This checklist is a release gate for Tivarto Android. A checked item requires implementation and evidence; documentation alone does not count.

## Account creation and deletion
- [ ] Provide an obvious in-app account deletion path.
- [ ] Provide an external web resource dedicated to account deletion requests, linked from the Play listing and accessible without installing the app. This is a narrow deletion endpoint/page, not a general Tivarto web product.
- [ ] Explain which account data is deleted, which data may be retained for legal/security reasons, and the retention period.
- [ ] Verify the requester and prevent unauthorized account deletion.
- [ ] Revoke sessions, refresh tokens, and other credentials after completion.
- [ ] Delete or anonymize user-linked personal data across database records and uploaded files, subject to documented legal retention.
- [ ] Do not cascade-delete a shared tenant, its business records, or other members when only one user's account is deleted.
- [ ] Support deletion requests for users who cannot sign in.
- [ ] Make retries safe and provide a clear completion/status response.

## Privacy and Data safety
- [ ] Publish an accurate privacy policy with developer/contact details, data categories, purposes, sharing, security, retention, and deletion instructions.
- [ ] Inventory every data type collected or shared, including account/contact details, business records, images/files, diagnostics, and device identifiers if applicable.
- [ ] Inventory all SDKs and service providers (Vercel, Supabase/PostgreSQL, Blob storage, notification/analytics/crash tools if added).
- [ ] Complete the Play Console Data safety form based on actual runtime behavior and SDK declarations.
- [ ] Ensure privacy policy, in-app disclosures, Data safety form, and store listing agree.
- [ ] Request only permissions needed for a user-visible feature; explain sensitive permissions before the system prompt where required.
- [ ] Use HTTPS for all network traffic and protect credentials/tokens.
- [ ] Provide a way to contact support about privacy and deletion.

## Android quality and release
- [ ] Set application ID, app name, versioning, signing, target API, and Play App Signing.
- [ ] Test login/session persistence, keyboard, screen sizes, back navigation, file picker/camera if used, uploads, downloads, and deep links.
- [ ] Handle offline/network errors without losing unsaved user input.
- [ ] Verify no normal product flow opens the general web site or unrestricted browser.
- [ ] Test account deletion end-to-end using disposable test accounts, never live customer data.
- [ ] Run accessibility, stability, and security checks; verify release build.
- [ ] Complete Play Console app-content declarations, privacy policy URL, Data safety, and any applicable testing requirements.

## Current status
No account-deletion implementation or Play Console submission has been verified yet. Do not describe Tivarto as compliant until each applicable item is completed and reviewed against the current Play Console requirements.
