-- Tivarto: Row Level Security
-- İlk migration'dan SONRA bir kez çalıştırın (yönetici/superuser kullanıcıyla).
-- Uygulama kullanıcısı (tivarto_app) superuser OLMAMALI, yoksa RLS atlanır.
--
-- Politikalar (fail-closed):
--   * app.tenant_id ayarlı  -> sadece o işletmenin satırları görünür/yazılır.
--   * app.platform = 'on'   -> platform yöneticisi tüm satırları görür (merkez panel).
--   * Hiçbiri ayarlı değil  -> HİÇBİR satır görünmez (güvenli varsayılan).
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
