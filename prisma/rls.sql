-- Tivarto: Row Level Security
-- İlk migration'dan SONRA bir kez çalıştırın (yönetici/superuser kullanıcıyla).
-- Uygulama kullanıcısı (tivarto_app) superuser OLMAMALI, yoksa RLS atlanır.
--
-- Politikalar: bir işletme (tenant) konteksti ayarlıysa sadece o işletmenin satırları
-- görülebilir; kontekst ayarlı değilse (platform admini gibi) tüm satırlar görünür.
-- Uygulama katamarı her tenant-scoped istekte 'app.tenant_id' ayarını mutlaka set etmelidir.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Membership','StoreSettings','Category','Product',
    'StockMovement','Order','OrderItem','Customer','Supplier',
    'GoodsReceipt','GoodsReceiptItem','AuditLog','Payment'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (current_setting(''app.tenant_id'', true) IS NULL
                OR "tenantId" = current_setting(''app.tenant_id'', true))
         WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true))',
      t
    );
  END LOOP;
END $$;
