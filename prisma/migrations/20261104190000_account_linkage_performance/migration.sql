-- Tivarto account linkage and query efficiency improvements.
-- Keep tenant isolation semantics unchanged while evaluating transaction-local
-- settings once per statement instead of once per row.

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
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (
           (SELECT current_setting(''app.platform'', true)) = ''on''
           OR "tenantId" = (SELECT current_setting(''app.tenant_id'', true))
         )
         WITH CHECK (
           (SELECT current_setting(''app.platform'', true)) = ''on''
           OR "tenantId" = (SELECT current_setting(''app.tenant_id'', true))
         )',
      t
    );
  END LOOP;
END $$;

-- Cover foreign keys used by cascades, deletes and joins.
CREATE INDEX IF NOT EXISTS "GoodsReceiptItem_receiptId_idx"
  ON public."GoodsReceiptItem" ("receiptId");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx"
  ON public."OrderItem" ("orderId");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdById_idx"
  ON public."SupportTicket" ("createdById");

-- Expired-session cleanup runs opportunistically at successful login.
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx"
  ON public."Session" ("expiresAt");
