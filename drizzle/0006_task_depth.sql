ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "due_at" timestamp with time zone;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "labels" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "max_retries" integer DEFAULT 3 NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "trigger_type" text DEFAULT 'schedule' NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "event_source" text;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "event_filter" jsonb DEFAULT '{}'::jsonb NOT NULL;

CREATE INDEX IF NOT EXISTS "workspace_tasks_due_at_idx" ON "workspace_tasks" ("user_id", "due_at");
CREATE INDEX IF NOT EXISTS "workspace_tasks_trigger_idx" ON "workspace_tasks" ("type", "trigger_type", "event_source");
