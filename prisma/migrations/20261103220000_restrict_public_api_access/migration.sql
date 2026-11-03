-- These platform tables are accessed only by the server-side Prisma app.
-- The browser-facing Supabase Data API must not read them directly.
DROP POLICY IF EXISTS platform_only ON public."Plan";
DROP POLICY IF EXISTS platform_only ON public."User";
DROP POLICY IF EXISTS platform_only ON public."Session";
DROP POLICY IF EXISTS platform_only ON public."Tenant";
DROP POLICY IF EXISTS platform_only ON public."FeatureFlag";

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, PUBLIC;
