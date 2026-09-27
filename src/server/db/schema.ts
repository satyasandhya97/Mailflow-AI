import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    flow: text("flow").notNull(),
    fullName: text("full_name"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [
    index("otp_codes_email_idx").on(table.email),
    index("otp_codes_expires_at_idx").on(table.expiresAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_token_hash_idx").on(table.tokenHash),
  ],
);

export const corsairIntegrations = pgTable("corsair_integrations", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  name: text("name").notNull(),
  config: jsonb("config").notNull().default({}),
  dek: text("dek"),
});

export const corsairAccounts = pgTable("corsair_accounts", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  tenantId: text("tenant_id").notNull(),
  integrationId: text("integration_id")
    .notNull()
    .references(() => corsairIntegrations.id),
  config: jsonb("config").notNull().default({}),
  dek: text("dek"),
});

export const corsairEntities = pgTable("corsair_entities", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  accountId: text("account_id")
    .notNull()
    .references(() => corsairAccounts.id),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  version: text("version").notNull(),
  data: jsonb("data").notNull().default({}),
});

export const agentConversations = pgTable(
  "agent_conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New chat"),
    titleLocked: boolean("title_locked").notNull().default(false),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_conversations_user_id_idx").on(table.userId),
    index("agent_conversations_updated_at_idx").on(table.updatedAt),
  ],
);

export const agentMessages = pgTable(
  "agent_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    parts: jsonb("parts").notNull().default([]),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_messages_conversation_id_idx").on(table.conversationId),
    index("agent_messages_order_idx").on(table.conversationId, table.orderIndex),
  ],
);

export const userPluginSettings = pgTable(
  "user_plugin_settings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pluginId: text("plugin_id").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    agentAccess: boolean("agent_access").notNull().default(true),
    automationConfig: jsonb("automation_config").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.pluginId] }),
    index("user_plugin_settings_user_id_idx").on(table.userId),
  ],
);

export const scheduledEmails = pgTable(
  "scheduled_emails",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
    to: text("to").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    threadId: text("thread_id"),
    source: text("source").notNull().default("user"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("scheduled_emails_user_id_idx").on(table.userId),
    index("scheduled_emails_status_send_at_idx").on(table.status, table.sendAt),
  ],
);

export const workspaceTasks = pgTable(
  "workspace_tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(),
    status: text("status").notNull().default("todo"),
    position: integer("position").notNull().default(0),
    instructions: text("instructions"),
    priority: text("priority").notNull().default("normal"),
    paused: boolean("paused").notNull().default(false),
    outputDelivery: text("output_delivery").notNull().default("none"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    labels: jsonb("labels").$type<string[]>().notNull().default([]),
    attempts: integer("attempts").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    triggerType: text("trigger_type").notNull().default("schedule"),
    eventSource: text("event_source"),
    eventFilter: jsonb("event_filter")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    scheduleType: text("schedule_type"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    scheduleTime: text("schedule_time"),
    scheduleDay: integer("schedule_day"),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    lastRunError: text("last_run_error"),
    lastRunOutput: text("last_run_output"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("workspace_tasks_user_id_idx").on(table.userId),
    index("workspace_tasks_status_idx").on(table.userId, table.status),
    index("workspace_tasks_next_run_idx").on(table.type, table.status, table.nextRunAt),
    index("workspace_tasks_due_at_idx").on(table.userId, table.dueAt),
    index("workspace_tasks_trigger_idx").on(
      table.type,
      table.triggerType,
      table.eventSource,
    ),
  ],
);

export const taskRuns = pgTable(
  "task_runs",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => workspaceTasks.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    output: text("output"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("task_runs_task_id_idx").on(table.taskId),
    index("task_runs_started_at_idx").on(table.startedAt),
  ],
);

export const corsairEvents = pgTable("corsair_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  accountId: text("account_id")
    .notNull()
    .references(() => corsairAccounts.id),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  status: text("status"),
});
