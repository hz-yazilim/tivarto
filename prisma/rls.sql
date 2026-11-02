-- Tivarto: Row Level Security
-- İlk migration'dan SONRA bir kez çalıştırın (yönetici kullanıcıyla).
-- Uygulama kullanıcısı (tivarto_app) superuser OLMAMALI, yoksa RLS atlanır.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Membership','StoreSettings','Category','Product',
    'StockMovement','Order','OrderItem','AuditLog'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ("tenantId" = current_setting(''app.tenant_id'', true))
         WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;
END $$;
