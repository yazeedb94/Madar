-- Migration: Add TenantBackup table for persistent PostgreSQL storage
-- Replaces ephemeral data/db.json filesystem storage

CREATE TABLE IF NOT EXISTS "TenantBackup" (
    "tenantId" TEXT NOT NULL,
    "data"     TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantBackup_pkey" PRIMARY KEY ("tenantId")
);
