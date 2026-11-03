-- Tivarto SaaS operations center
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "FeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "category" TEXT NOT NULL DEFAULT 'product',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

CREATE TABLE "PlatformAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "reason" TEXT,
  "beforeData" JSONB,
  "afterData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformAuditLog_createdAt_idx" ON "PlatformAuditLog"("createdAt");
CREATE INDEX "PlatformAuditLog_actorId_createdAt_idx" ON "PlatformAuditLog"("actorId", "createdAt");
CREATE INDEX "PlatformAuditLog_targetType_targetId_idx" ON "PlatformAuditLog"("targetType", "targetId");

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdById" TEXT,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportTicket_tenantId_createdAt_idx" ON "SupportTicket"("tenantId", "createdAt");
CREATE INDEX "SupportTicket_status_priority_createdAt_idx" ON "SupportTicket"("status", "priority", "createdAt");
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit kayıtları uygulama seviyesinde append-only olacak şekilde korunur.
CREATE OR REPLACE FUNCTION prevent_platform_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PlatformAuditLog kayıtları değiştirilemez veya silinemez.';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "PlatformAuditLog_immutable"
BEFORE UPDATE OR DELETE ON "PlatformAuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_platform_audit_log_mutation();

-- Varsayılan operasyon anahtarları: bakım modu başlangıçta kapalıdır.
INSERT INTO "FeatureFlag" ("id", "key", "name", "description", "enabled", "category", "updatedAt")
VALUES
  ('flag_maintenance_mode', 'maintenance_mode', 'Bakım modu', 'İşletmelerin veri değiştiren işlemlerini geçici olarak durdurur.', false, 'operations', CURRENT_TIMESTAMP),
  ('flag_beta_reports', 'beta_reports', 'Gelişmiş raporlar', 'Gelişmiş rapor ekranları için kontrollü erişim anahtarı.', false, 'product', CURRENT_TIMESTAMP),
  ('flag_new_inventory', 'new_inventory', 'Yeni stok deneyimi', 'Yeni stok modülü için kontrollü yayın anahtarı.', false, 'product', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
