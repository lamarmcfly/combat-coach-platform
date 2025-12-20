-- CreateEnum
CREATE TYPE "CoachingRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESPONDED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CoachingRequestType" AS ENUM ('VIDEO_REVIEW', 'TECHNIQUE_CHECK', 'FORM_ANALYSIS', 'TRAINING_QUESTION', 'STRATEGY_ADVICE', 'GENERAL');

-- CreateEnum
CREATE TYPE "CoachingPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('VIDEO', 'IMAGE', 'DOCUMENT', 'AUDIO');

-- CreateTable
CREATE TABLE "CoachingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "CoachingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "type" "CoachingRequestType" NOT NULL DEFAULT 'GENERAL',
    "priority" "CoachingPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "courseId" TEXT,
    "lessonId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCoachResponse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "messageId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachingRequest_userId_status_idx" ON "CoachingRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "CoachingRequest_coachId_status_idx" ON "CoachingRequest"("coachId", "status");

-- CreateIndex
CREATE INDEX "CoachingRequest_submittedAt_idx" ON "CoachingRequest"("submittedAt");

-- CreateIndex
CREATE INDEX "CoachingRequest_status_priority_idx" ON "CoachingRequest"("status", "priority");

-- CreateIndex
CREATE INDEX "CoachingMessage_requestId_createdAt_idx" ON "CoachingMessage"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachingAttachment_requestId_idx" ON "CoachingAttachment"("requestId");

-- CreateIndex
CREATE INDEX "CoachingAttachment_messageId_idx" ON "CoachingAttachment"("messageId");

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingRequest" ADD CONSTRAINT "CoachingRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingMessage" ADD CONSTRAINT "CoachingMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CoachingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingAttachment" ADD CONSTRAINT "CoachingAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CoachingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingAttachment" ADD CONSTRAINT "CoachingAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CoachingMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
