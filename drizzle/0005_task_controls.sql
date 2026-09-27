ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'normal' NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "paused" boolean DEFAULT false NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "output_delivery" text DEFAULT 'none' NOT NULL;
ALTER TABLE "workspace_tasks" ADD COLUMN IF NOT EXISTS "last_run_output" text;
