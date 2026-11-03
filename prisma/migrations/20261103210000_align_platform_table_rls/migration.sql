-- Platform-level tables are intentionally not tenant-RLS protected.
-- Auth/session and tenant lookup code reads these tables before a tenant
-- context can be established. Keep RLS on tenant-owned tables in rls.sql.
ALTER TABLE public."Plan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tenant" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeatureFlag" DISABLE ROW LEVEL SECURITY;
