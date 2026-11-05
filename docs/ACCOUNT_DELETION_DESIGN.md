# Tivarto account and personal-data deletion design

## Current schema observations (from main at migration start)
- `User` contains email, password hash, name, admin/suspension flags, timestamps.
- `Session` belongs to `User` with database cascade on user deletion.
- `Membership` links users to tenants; it has no cascade rule.
- `Tenant` owns business data: products, categories, stock movements, orders, customers, suppliers, goods receipts, store settings, payments, support tickets, and audit logs.
- `AuditLog.userId` is a nullable scalar (not a declared User relation).
- `SupportTicket.createdById` is a nullable User relation.
- Uploaded images are stored in Vercel Blob under `tenants/<tenantId>/...`; the database stores public image URLs.
- No complete account-deletion workflow was found in the inspected auth/settings routes.

## Required behavior
### Delete a staff member account
1. Authenticate the user and require a clear confirmation.
2. Remove only that user's membership(s), after confirming that no business owner role or legal business obligation is being silently removed.
3. Reassign or anonymize personal references in support/audit records where appropriate.
4. Revoke all sessions and remove credentials.
5. Delete the user record only when no remaining references prevent it.
6. Preserve the tenant, other members, products, stock, orders, customers, suppliers, and financial/business records.

### Delete an owner account
1. Show every tenant where the user is OWNER.
2. If another authorized OWNER exists, require the user to transfer ownership or confirm a policy-defined handover before account deletion.
3. If no other OWNER exists, do not silently delete the tenant. Offer a separate, explicit business-closure/data-deletion process with a clear impact summary.
4. Keep legally required accounting/transaction records for the applicable retention period; do not claim all business records can always be erased immediately.
5. Remove or anonymize personal account data not subject to retention, revoke sessions, and clean up user-owned uploaded objects only after ownership/reference checks.

### External deletion request
- Publish a public, minimal account-deletion request page that does not expose the business app or management panel.
- Verify control of the account email before processing an unauthenticated request. Do not reveal whether an email address has an account.
- Record request time, verification, status, completion time, retained data categories, and legal basis for any retention.
- Provide status/confirmation to the requester without exposing internal IDs or other tenant data.
- Define and meet a documented completion deadline consistent with applicable law and current Play Console requirements.

## Implementation requirements
- Add a deletion-request state machine (e.g. PENDING_VERIFICATION, VERIFIED, PROCESSING, COMPLETED, REJECTED) with opaque one-time tokens stored only as hashes and expiry.
- Rate-limit requests by IP/account and prevent email enumeration.
- Use transactions for relational changes; run blob cleanup as a retryable background job after DB state is committed.
- Use explicit tenant scoping and RLS-safe transactions. Never accept tenant/user IDs from the client as authority.
- Make retries idempotent. Log security-relevant outcomes without copying passwords, tokens, or unnecessary personal data into logs.
- Add tests for staff deletion, sole-owner protection, multi-owner transfer, cross-tenant attempts, token expiry/replay, session revocation, blob references, and legal-retention exceptions.

## Release blockers
- No email-verification provider is currently configured in the project status. The external request flow must not pretend to verify email until a real provider is integrated.
- No destructive deletion code should be deployed until the ownership/retention policy is finalized and automated tests cover the scenarios above.
- Test with disposable test accounts only. Never use live user or tenant records for deletion tests.
