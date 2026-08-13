-- AlterTable
ALTER TABLE "users" ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN "renewalReminderEnabled" BOOLEAN NOT NULL DEFAULT true;
