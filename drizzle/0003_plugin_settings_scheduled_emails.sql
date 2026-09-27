CREATE TABLE IF NOT EXISTS "user_plugin_settings" (
	"user_id" text NOT NULL,
	"plugin_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"agent_access" boolean DEFAULT true NOT NULL,
	"automation_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_plugin_settings_user_id_plugin_id_pk" PRIMARY KEY("user_id","plugin_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_plugin_settings_user_id_idx" ON "user_plugin_settings" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_plugin_settings" ADD CONSTRAINT "user_plugin_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_emails" (
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
CREATE INDEX IF NOT EXISTS "scheduled_emails_user_id_idx" ON "scheduled_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduled_emails_status_send_at_idx" ON "scheduled_emails" USING btree ("status","send_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
