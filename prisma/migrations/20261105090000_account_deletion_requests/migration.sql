-- External account deletion requests for Google Play policy.
CREATE TYPE "AccountDeletionRequestStatus" AS ENUM (
  'PENDING_VERIFICATION',
  'VERIFIED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED'
);

CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "tokenHash" TEXT,
  "requestFingerprint" TEXT NOT NULL,
  "status" "AccountDeletionRequestStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountDeletionRequest_tokenHash_key"
  ON "AccountDeletionRequest"("tokenHash");
CREATE INDEX "AccountDeletionRequest_userId_idx"
  ON "AccountDeletionRequest"("userId");
CREATE INDEX "AccountDeletionRequest_requestFingerprint_createdAt_idx"
  ON "AccountDeletionRequest"("requestFingerprint", "createdAt");
CREATE INDEX "AccountDeletionRequest_status_createdAt_idx"
  ON "AccountDeletionRequest"("status", "createdAt");

ALTER TABLE "AccountDeletionRequest"
  ADD CONSTRAINT "AccountDeletionRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
