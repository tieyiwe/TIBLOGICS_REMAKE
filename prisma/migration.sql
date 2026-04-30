-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum (safe idempotent creation via DO blocks)
DO $$ BEGIN CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ProspectSource" AS ENUM ('TIBS_ADVISOR', 'WEBSITE_SCANNER', 'CONTACT_FORM', 'REFERRAL', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ProspectStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ProjectCategory" AS ENUM ('SAAS', 'CLIENT', 'EDUCATION', 'INTERNAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ProjectStatus" AS ENUM ('CONCEPT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AgentLeadStatus" AS ENUM ('NEW', 'TRANSFERRED', 'CONTACTED', 'HOT', 'WARM', 'COLD', 'UNINTERESTED', 'CONVERTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Appointment" ("id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,"serviceType" TEXT NOT NULL,"serviceDuration" TEXT NOT NULL,"servicePrice" INTEGER NOT NULL,"date" TIMESTAMP(3) NOT NULL,"timeSlot" TEXT NOT NULL,"timezone" TEXT NOT NULL DEFAULT 'America/New_York',"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"email" TEXT NOT NULL,"company" TEXT,"goalNotes" TEXT,"addOnRecording" BOOLEAN NOT NULL DEFAULT false,"addOnActionPlan" BOOLEAN NOT NULL DEFAULT false,"addOnSlackAccess" BOOLEAN NOT NULL DEFAULT false,"totalAmount" INTEGER NOT NULL,"status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',"stripeSessionId" TEXT,"stripePaymentId" TEXT,"paymentStatus" TEXT,"zoomLink" TEXT,"notes" TEXT,"reminderSent" BOOLEAN NOT NULL DEFAULT false,"confirmedAt" TIMESTAMP(3),"cancelledAt" TIMESTAMP(3),"cancelReason" TEXT,CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "Prospect" ("id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,"name" TEXT NOT NULL,"business" TEXT NOT NULL,"industry" TEXT NOT NULL,"mainChallenge" TEXT NOT NULL,"budget" TEXT NOT NULL,"suggestedSolutions" TEXT[],"email" TEXT,"phone" TEXT,"source" "ProspectSource" NOT NULL DEFAULT 'TIBS_ADVISOR',"status" "ProspectStatus" NOT NULL DEFAULT 'NEW',"priority" TEXT,"estimatedValue" INTEGER,"notes" TEXT,"followUpDate" TIMESTAMP(3),"convertedAt" TIMESTAMP(3),"conversationLog" JSONB,"archived" BOOLEAN NOT NULL DEFAULT false,CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "ScannerLead" ("id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"url" TEXT NOT NULL,"overallScore" INTEGER NOT NULL,"seoScore" INTEGER NOT NULL,"perfScore" INTEGER NOT NULL,"uxScore" INTEGER NOT NULL,"aiScore" INTEGER NOT NULL,"findings" JSONB NOT NULL,"aiDescription" TEXT NOT NULL,"email" TEXT,"name" TEXT,"bookedCallAt" TIMESTAMP(3),CONSTRAINT "ScannerLead_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "ToolUsage" ("id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"tool" TEXT NOT NULL,"sessionId" TEXT,"metadata" JSONB,CONSTRAINT "ToolUsage_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "AdminSettings" ("id" TEXT NOT NULL,"key" TEXT NOT NULL,"value" TEXT NOT NULL,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "AdminSettings_key_key" ON "AdminSettings"("key");
CREATE TABLE IF NOT EXISTS "BlockedDate" ("id" TEXT NOT NULL,"date" TIMESTAMP(3) NOT NULL,"reason" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "Project" ("id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"name" TEXT NOT NULL,"description" TEXT,"category" "ProjectCategory" NOT NULL,"status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',"priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',"progress" INTEGER NOT NULL DEFAULT 0,"color" TEXT NOT NULL DEFAULT '#2251A3',"revenueEarned" INTEGER NOT NULL DEFAULT 0,"revenuePotential" INTEGER NOT NULL DEFAULT 0,"monthlyRecurring" INTEGER NOT NULL DEFAULT 0,"startDate" TIMESTAMP(3),"deadline" TIMESTAMP(3),"completedAt" TIMESTAMP(3),"starred" BOOLEAN NOT NULL DEFAULT false,"archived" BOOLEAN NOT NULL DEFAULT false,"notes" TEXT,CONSTRAINT "Project_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "ProjectTask" ("id" TEXT NOT NULL,"projectId" TEXT NOT NULL,"text" TEXT NOT NULL,"done" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"dueDate" TIMESTAMP(3),"order" INTEGER NOT NULL DEFAULT 0,CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"firstName" TEXT,"source" TEXT NOT NULL DEFAULT 'blog',"active" BOOLEAN NOT NULL DEFAULT true,"subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"unsubscribedAt" TIMESTAMP(3),CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE TABLE IF NOT EXISTS "NewsletterCampaign" ("id" TEXT NOT NULL,"title" TEXT NOT NULL,"subject" TEXT NOT NULL,"previewText" TEXT,"contentHtml" TEXT NOT NULL,"category" TEXT NOT NULL DEFAULT 'general',"status" TEXT NOT NULL DEFAULT 'DRAFT',"sentAt" TIMESTAMP(3),"recipientCount" INTEGER NOT NULL DEFAULT 0,"sentBy" TEXT NOT NULL DEFAULT 'Echelon',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "ServiceRequest" ("id" TEXT NOT NULL,"firstName" TEXT NOT NULL,"lastName" TEXT NOT NULL,"email" TEXT NOT NULL,"phone" TEXT,"company" TEXT,"service" TEXT NOT NULL,"description" TEXT NOT NULL,"budget" TEXT,"timeline" TEXT,"tiboAssisted" BOOLEAN NOT NULL DEFAULT false,"aiSummary" TEXT,"status" TEXT NOT NULL DEFAULT 'NEW',"notes" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "BlogPost" ("id" TEXT NOT NULL,"slug" TEXT NOT NULL,"title" TEXT NOT NULL,"excerpt" TEXT NOT NULL,"content" TEXT NOT NULL,"category" TEXT NOT NULL,"tags" TEXT[],"coverImage" TEXT,"coverEmoji" TEXT NOT NULL DEFAULT '🤖',"coverGradient" TEXT NOT NULL DEFAULT 'from-[#1B3A6B] to-[#2251A3]',"author" TEXT NOT NULL DEFAULT 'Echelon AI',"readingTime" INTEGER NOT NULL DEFAULT 5,"featured" BOOLEAN NOT NULL DEFAULT false,"published" BOOLEAN NOT NULL DEFAULT true,"aiGenerated" BOOLEAN NOT NULL DEFAULT false,"sourceUrl" TEXT,"sourceTitle" TEXT,"viewCount" INTEGER NOT NULL DEFAULT 0,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE TABLE IF NOT EXISTS "BreakingNews" ("id" TEXT NOT NULL,"headline" TEXT NOT NULL,"summary" TEXT NOT NULL,"sourceUrl" TEXT,"source" TEXT,"active" BOOLEAN NOT NULL DEFAULT true,"expiresAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "BreakingNews_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "BlogRefreshLog" ("id" TEXT NOT NULL,"success" BOOLEAN NOT NULL,"postsAdded" INTEGER NOT NULL DEFAULT 0,"message" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "BlogRefreshLog_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "CommandCenterSync" ("id" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"projectId" TEXT,"projectName" TEXT NOT NULL,"action" TEXT NOT NULL,"source" TEXT NOT NULL,"changesDiff" JSONB NOT NULL,"chatSummary" TEXT,"undoneAt" TIMESTAMP(3),CONSTRAINT "CommandCenterSync_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "PageView" ("id" TEXT NOT NULL,"page" TEXT NOT NULL,"referrer" TEXT,"origin" TEXT NOT NULL DEFAULT 'direct',"device" TEXT NOT NULL DEFAULT 'desktop',"browser" TEXT,"os" TEXT,"ip" TEXT,"sessionId" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "PageView_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "ActiveSession" ("id" TEXT NOT NULL,"sessionId" TEXT NOT NULL,"page" TEXT NOT NULL,"device" TEXT NOT NULL DEFAULT 'desktop',"browser" TEXT,"os" TEXT,"origin" TEXT NOT NULL DEFAULT 'direct',"ip" TEXT,"lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ActiveSession_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "ActiveSession_sessionId_key" ON "ActiveSession"("sessionId");
CREATE TABLE IF NOT EXISTS "Collaborator" ("id" TEXT NOT NULL,"name" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT,"role" TEXT NOT NULL DEFAULT 'CUSTOM',"permissions" TEXT[],"isAdmin" BOOLEAN NOT NULL DEFAULT false,"active" BOOLEAN NOT NULL DEFAULT true,"inviteToken" TEXT,"inviteExpires" TIMESTAMP(3),"invitedBy" TEXT NOT NULL DEFAULT 'admin',"lastLoginAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "Collaborator_email_key" ON "Collaborator"("email");
CREATE TABLE IF NOT EXISTS "CollaboratorActivityLog" ("id" TEXT NOT NULL,"collaboratorId" TEXT NOT NULL,"action" TEXT NOT NULL,"resource" TEXT NOT NULL,"resourceId" TEXT,"details" TEXT,"ip" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CollaboratorActivityLog_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "AgentLead" ("id" TEXT NOT NULL,"source" TEXT NOT NULL DEFAULT 'ai_generated',"companyName" TEXT NOT NULL,"contactName" TEXT,"email" TEXT,"phone" TEXT,"website" TEXT,"location" TEXT,"industry" TEXT,"description" TEXT,"notes" TEXT,"status" "AgentLeadStatus" NOT NULL DEFAULT 'NEW',"fromAgent" TEXT NOT NULL DEFAULT 'aria',"assignedTo" TEXT,"callSid" TEXT,"callStatus" TEXT,"callNotes" TEXT,"transferredAt" TIMESTAMP(3),"contactedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AgentLead_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "AgentMessage" ("id" TEXT NOT NULL,"fromAgent" TEXT NOT NULL,"toAgent" TEXT NOT NULL,"type" TEXT NOT NULL DEFAULT 'notification',"subject" TEXT,"payload" JSONB NOT NULL DEFAULT '{}',"read" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "AgentRun" ("id" TEXT NOT NULL,"agent" TEXT NOT NULL,"action" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'running',"input" JSONB,"output" JSONB,"error" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "PartnershipApplication" ("id" TEXT NOT NULL,"businessName" TEXT NOT NULL,"contactName" TEXT NOT NULL,"email" TEXT NOT NULL,"phone" TEXT NOT NULL,"website" TEXT,"address" TEXT,"description" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "PartnershipApplication_pkey" PRIMARY KEY ("id"));
CREATE TABLE IF NOT EXISTS "WaitlistEntry" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"product" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistEntry_email_product_key" ON "WaitlistEntry"("email", "product");

ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollaboratorActivityLog" ADD CONSTRAINT "CollaboratorActivityLog_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "Collaborator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AgentLead outreach columns (Lead Hunter + Bland.ai voice outreach)
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "callTranscript" TEXT;
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "callSummary" TEXT;
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "blandCallId" TEXT;
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "interestedIn" TEXT[] DEFAULT '{}';
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "hasWebsite" BOOLEAN;
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "businessInfo" JSONB;
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "scrapedAt" TIMESTAMP(3);
ALTER TABLE "AgentLead" ADD COLUMN IF NOT EXISTS "area" TEXT;

-- Add phone to Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "content" TEXT,
  "type" TEXT NOT NULL DEFAULT 'TRAINING',
  "price" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "capacity" INTEGER,
  "location" TEXT NOT NULL DEFAULT 'Online',
  "date" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "timeSlot" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
  "coverImage" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
  "stripePaymentLink" TEXT,
  "spots" INTEGER,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Event_slug_key" ON "Event"("slug");
CREATE INDEX IF NOT EXISTS "Event_published_idx" ON "Event"("published");
CREATE INDEX IF NOT EXISTS "Event_date_idx" ON "Event"("date");
