-- Tivarto production tenant isolation and platform table protection.
-- Applied to the new Supabase project; kept in source control for reproducible deployments.
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['Plan','User','Session','Tenant','FeatureFlag','PlatformAuditLog']
 LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  EXECUTE format('DROP POLICY IF EXISTS platform_only ON %I', t);
  EXECUTE format('CREATE POLICY platform_only ON %I USING ((select current_setting(''app.platform'', true)) = ''on'') WITH CHECK ((select current_setting(''app.platform'', true)) = ''on'')', t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['Membership','StoreSettings','Category','Product','StockMovement','Order','OrderItem','Customer','Supplier','GoodsReceipt','GoodsReceiptItem','AuditLog','Payment','SupportTicket']
 LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
  EXECUTE format('CREATE POLICY tenant_isolation ON %I USING ((select current_setting(''app.platform'', true)) = ''on'' OR "tenantId" = (select current_setting(''app.tenant_id'', true))) WITH CHECK ((select current_setting(''app.platform'', true)) = ''on'' OR "tenantId" = (select current_setting(''app.tenant_id'', true)))', t);
 END LOOP;
END $$;
ALTER FUNCTION public.prevent_platform_audit_log_mutation() SET search_path = public, pg_temp;
