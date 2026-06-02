-- Migration: Initial schema (PostgreSQL)
-- Note: Using IF NOT EXISTS to safely run against existing Railway database

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id"                 TEXT NOT NULL,
    "name"               TEXT NOT NULL,
    "type"               TEXT NOT NULL,
    "email"              TEXT NOT NULL,
    "password"           TEXT NOT NULL,
    "currency"           TEXT NOT NULL,
    "plan"               TEXT NOT NULL,
    "language"           TEXT NOT NULL,
    "status"             TEXT NOT NULL DEFAULT 'active',
    "subscriptionPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "subscriptionPrice"  DOUBLE PRECISION,
    "expiryDate"         TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Setting" (
    "id"       TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "theme"    TEXT,
    "locale"   TEXT,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Setting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Customer" (
    "id"       TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "email"    TEXT NOT NULL,
    "phone"    TEXT,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Plan" (
    "id"       TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "price"    DOUBLE PRECISION NOT NULL,
    "period"   TEXT NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Plan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id"       TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date"     TIMESTAMP(3) NOT NULL,
    "present"  BOOLEAN NOT NULL,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id"       TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount"   DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "paidAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notification" (
    "id"        TEXT NOT NULL,
    "tenantId"  TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformPlan" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "price"     DOUBLE PRECISION NOT NULL,
    "period"    TEXT NOT NULL DEFAULT 'monthly',
    "currency"  TEXT NOT NULL DEFAULT 'SAR',
    "features"  TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SaaSSetting" (
    "id"            TEXT NOT NULL,
    "platformName"  TEXT NOT NULL DEFAULT 'منصتي',
    "logoUrl"       TEXT,
    "theme"         TEXT NOT NULL DEFAULT 'dark',
    "currency"      TEXT NOT NULL DEFAULT 'SAR',
    "language"      TEXT NOT NULL DEFAULT 'ar',
    "taxes"         DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "adminEmail"    TEXT NOT NULL DEFAULT 'admin@saas.com',
    "adminPassword" TEXT NOT NULL DEFAULT 'admin',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaaSSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id"        TEXT NOT NULL,
    "action"    TEXT NOT NULL,
    "operator"  TEXT NOT NULL,
    "target"    TEXT NOT NULL,
    "ip"        TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT,
    "tenantName"  TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "subject"     TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'open',
    "priority"    TEXT NOT NULL DEFAULT 'medium',
    "reply"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SupportLog" (
    "id"        TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SystemError" (
    "id"        TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "count"     INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ActiveSession" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "role"       TEXT NOT NULL,
    "ip"         TEXT NOT NULL,
    "userAgent"  TEXT NOT NULL,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformInvoice" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "amount"     DOUBLE PRECISION NOT NULL,
    "currency"   TEXT NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'unpaid',
    "dueDate"    TIMESTAMP(3) NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformPayment" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "amount"     DOUBLE PRECISION NOT NULL,
    "currency"   TEXT NOT NULL,
    "method"     TEXT NOT NULL,
    "paidAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformRenewal" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "planName"   TEXT NOT NULL,
    "period"     TEXT NOT NULL,
    "price"      DOUBLE PRECISION NOT NULL,
    "renewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (IF NOT EXISTS to handle existing indexes)
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_email_key" ON "Tenant"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_tenantId_key" ON "Setting"("tenantId");
