CREATE TABLE "scheduled_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"thread_id" text,
	"source" text DEFAULT 'user' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"status" text NOT NULL,
	"output" text,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_plugin_settings" (
	"user_id" text NOT NULL,
	"plugin_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"agent_access" boolean DEFAULT true NOT NULL,
	"automation_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_plugin_settings_user_id_plugin_id_pk" PRIMARY KEY("user_id","plugin_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"instructions" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"output_delivery" text DEFAULT 'none' NOT NULL,
	"due_at" timestamp with time zone,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"trigger_type" text DEFAULT 'schedule' NOT NULL,
	"event_source" text,
	"event_filter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"schedule_type" text,
	"scheduled_at" timestamp with time zone,
	"schedule_time" text,
	"schedule_day" integer,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"last_run_error" text,
	"last_run_output" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_runs" ADD CONSTRAINT "task_runs_task_id_workspace_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."workspace_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plugin_settings" ADD CONSTRAINT "user_plugin_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_tasks" ADD CONSTRAINT "workspace_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_emails_user_id_idx" ON "scheduled_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_emails_status_send_at_idx" ON "scheduled_emails" USING btree ("status","send_at");--> statement-breakpoint
CREATE INDEX "task_runs_task_id_idx" ON "task_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_runs_started_at_idx" ON "task_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "user_plugin_settings_user_id_idx" ON "user_plugin_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_tasks_user_id_idx" ON "workspace_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_tasks_status_idx" ON "workspace_tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "workspace_tasks_next_run_idx" ON "workspace_tasks" USING btree ("type","status","next_run_at");--> statement-breakpoint
CREATE INDEX "workspace_tasks_due_at_idx" ON "workspace_tasks" USING btree ("user_id","due_at");--> statement-breakpoint
CREATE INDEX "workspace_tasks_trigger_idx" ON "workspace_tasks" USING btree ("type","trigger_type","event_source");