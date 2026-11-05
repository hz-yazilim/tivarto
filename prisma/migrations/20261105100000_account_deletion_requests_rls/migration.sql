-- Lock down account-deletion tokens and account references.
-- This migration is idempotent because the production Supabase hotfix may
-- already have applied the same protections before this repository release.
ALTER TABLE public."AccountDeletionRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountDeletionRequest" FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."AccountDeletionRequest" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."AccountDeletionRequest" TO tivarto_app;

DROP POLICY IF EXISTS account_deletion_app_access ON public."AccountDeletionRequest";
CREATE POLICY account_deletion_app_access
  ON public."AccountDeletionRequest"
  FOR ALL
  TO tivarto_app
  USING (true)
  WITH CHECK (true);
