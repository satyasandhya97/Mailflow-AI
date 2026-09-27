CREATE TABLE IF NOT EXISTS "workspace_tasks" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "type" text NOT NULL,
  "status" text DEFAULT 'todo' NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "instructions" text,
  "schedule_type" text,
  "scheduled_at" timestamp with time zone,
  "schedule_time" text,
  "schedule_day" integer,
  "timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
  "next_run_at" timestamp with time zone,
  "last_run_at" timestamp with time zone,
  "last_run_error" text,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "workspace_tasks_user_id_idx" ON "workspace_tasks" ("user_id");
CREATE INDEX IF NOT EXISTS "workspace_tasks_status_idx" ON "workspace_tasks" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "workspace_tasks_next_run_idx" ON "workspace_tasks" ("type", "status", "next_run_at");

CREATE TABLE IF NOT EXISTS "task_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "task_id" text NOT NULL REFERENCES "workspace_tasks"("id") ON DELETE CASCADE,
  "status" text NOT NULL,
  "output" text,
  "error" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "task_runs_task_id_idx" ON "task_runs" ("task_id");
CREATE INDEX IF NOT EXISTS "task_runs_started_at_idx" ON "task_runs" ("started_at");
