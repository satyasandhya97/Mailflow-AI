import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(32),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(3).optional(),
    CORSAIR_KEK: z.string().min(1),
    TENANT_ID: z.string().min(1).default("dev"),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GMAIL_PUBSUB_TOPIC: z.string().min(1).optional(),
    APP_URL: z.string().url(),
    OAUTH_REDIRECT_URI: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GROQ_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    MEM0_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    MEM0_API_KEY: z.string().min(1).optional(),
    AGENT_MCP_INTERNAL_SECRET: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(1).optional(),
  },

  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM ?? process.env.SMTP_FROM,
    CORSAIR_KEK: process.env.CORSAIR_KEK,
    TENANT_ID: process.env.TENANT_ID,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GMAIL_PUBSUB_TOPIC: process.env.GMAIL_PUBSUB_TOPIC,
    APP_URL: process.env.APP_URL,
    OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI,
    NODE_ENV: process.env.NODE_ENV,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    MEM0_ENABLED: process.env.MEM0_ENABLED,
    MEM0_API_KEY: process.env.MEM0_API_KEY,
    AGENT_MCP_INTERNAL_SECRET: process.env.AGENT_MCP_INTERNAL_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
