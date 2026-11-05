-- Tivarto: Row Level Security
-- İlk migration'dan SONRA bir kez çalıştırın (yönetici/superuser kullanıcıyla).
-- Uygulama kullanıcısı (tivarto_app) superuser OLMAMALI, yoksa RLS atlanır.
--
-- Politikalar (fail-closed):
--   * app.tenant_id ayarlı  -> sadece o işletmenin satırları görünür/yazılır.
--   * app.platform = 'on'   -> platform yöneticisi tüm tenant satırlarını görür.
--   * Tenant/platform bağlamı yok -> tenant verisi görünmez.
--   * AccountDeletionRequest -> yalnızca sunucu uygulama rolü erişebilir.
-- Uygulama tarafı: tenant işlemleri withTenant(), platform işlemleri withPlatform()
-- fonksiyonlarından geçmelidir (bkz. src/lib/db.ts).

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Membership','StoreSettings','Category','Product',
    'StockMovement','Order','OrderItem','Customer','Supplier',
    'GoodsReceipt','GoodsReceiptItem','AuditLog','Payment','SupportTicket'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING ((SELECT current_setting(''app.platform'', true)) = ''on''
                OR "tenantId" = (SELECT current_setting(''app.tenant_id'', true)))
         WITH CHECK ((SELECT current_setting(''app.platform'', true)) = ''on''
                     OR "tenantId" = (SELECT current_setting(''app.tenant_id'', true)))',
      t
    );
  END LOOP;
END $$;

-- Account deletion requests contain token hashes and email-linked account IDs.
-- They are only accessed by the trusted server-side application role, never
-- through the public Supabase Data API roles.
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
