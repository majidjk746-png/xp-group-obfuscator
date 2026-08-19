-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PERSONAL', 'COMMERCIAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('UPLOADING', 'VALIDATING', 'QUEUED', 'PROTECTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProtectionTier" AS ENUM ('BASIC', 'ADVANCED', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeId" TEXT,
    "plan" "Plan" NOT NULL,
    "monthlyQuota" INTEGER NOT NULL DEFAULT 50,
    "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "billingCycleStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'UPLOADING',
    "originalName" TEXT NOT NULL,
    "originalSize" INTEGER NOT NULL,
    "protectedSize" INTEGER,
    "protectionTier" "ProtectionTier" NOT NULL,
    "preset" TEXT NOT NULL DEFAULT 'default',
    "stringEncryption" BOOLEAN NOT NULL DEFAULT false,
    "fieldEncryption" BOOLEAN NOT NULL DEFAULT false,
    "controlFlow" BOOLEAN NOT NULL DEFAULT false,
    "nativeStub" BOOLEAN NOT NULL DEFAULT false,
    "antiDebug" BOOLEAN NOT NULL DEFAULT false,
    "antiDump" BOOLEAN NOT NULL DEFAULT false,
    "antiApiHooks" BOOLEAN NOT NULL DEFAULT false,
    "vmBytecode" BOOLEAN NOT NULL DEFAULT false,
    "selfRefKey" BOOLEAN NOT NULL DEFAULT false,
    "originalPath" TEXT,
    "protectedPath" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "processingMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProcessedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiKey_key" ON "User"("apiKey");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_apiKey_idx" ON "User"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeId_key" ON "Subscription"("stripeId");

-- CreateIndex
CREATE INDEX "ProcessedJob_userId_createdAt_idx" ON "ProcessedJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProcessedJob_status_idx" ON "ProcessedJob"("status");

-- CreateIndex
CREATE INDEX "ProcessedJob_expiresAt_idx" ON "ProcessedJob"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitLog_userId_endpoint_windowStart_idx" ON "RateLimitLog"("userId", "endpoint", "windowStart");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedJob" ADD CONSTRAINT "ProcessedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitLog" ADD CONSTRAINT "RateLimitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
