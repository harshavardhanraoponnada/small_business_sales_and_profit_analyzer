-- Add per-user schedule timing metadata for automated reports
ALTER TABLE "User"
  ADD COLUMN "reportScheduleTime" TEXT,
  ADD COLUMN "reportScheduleWeekday" TEXT;
