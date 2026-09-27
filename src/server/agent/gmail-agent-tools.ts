import { tool, type ToolSet } from "ai";
import { z } from "zod";

import {
  getMessage,
  listGmailMessagesForAgent,
  sendEmail,
} from "@/server/services/gmail.service";
import { createScheduledEmail } from "@/server/services/scheduled-email.service";
import { safeToolExecute } from "@/server/agent/tool-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GmailAgentToolsOptions = {
  userId: string;
};

export function buildGmailAgentTools(options: GmailAgentToolsOptions): ToolSet {
  const { userId } = options;

  return {
    list_gmail_messages: tool({
      description:
        "List or search Gmail messages. Use label SENT for sent mail. Set todayOnly=true for mail sent/received today.",
      inputSchema: z.object({
        label: z
          .enum(["INBOX", "SENT", "STARRED", "DRAFT"])
          .optional()
          .describe("Gmail label filter, e.g. SENT for sent mail"),
        query: z
          .string()
          .optional()
          .describe("Gmail search query, e.g. subject:hello"),
        todayOnly: z
          .boolean()
          .optional()
          .describe("If true, only messages from today"),
        limit: z.number().min(1).max(50).optional(),
      }),
      execute: safeToolExecute(async (input) => {
        const messages = await listGmailMessagesForAgent(userId, input);

        return JSON.stringify({
          count: messages.length,
          messages: messages.map((message) => ({
            id: message.id,
            subject: message.subject,
            from: message.from,
            to: message.to,
            date: message.date,
            snippet: message.snippet,
          })),
        });
      }),
    }),

    get_gmail_message: tool({
      description:
        "Read full details of one Gmail message by ID. Use after list_gmail_messages when the user wants email body/details.",
      inputSchema: z.object({
        id: z.string().min(1).describe("Gmail message ID from list_gmail_messages"),
      }),
      execute: safeToolExecute(async (input) => {
        const message = await getMessage(userId, input.id);

        return JSON.stringify({
          id: message.id,
          threadId: message.threadId,
          subject: message.subject,
          from: message.from,
          to: message.to,
          date: message.date,
          snippet: message.snippet,
          body: message.body,
        });
      }),
    }),

    send_gmail_email: tool({
      description:
        "Send an email immediately from the user's Gmail account. Confirm with the user before sending unless they explicitly asked to send.",
      inputSchema: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().min(1),
        body: z.string().min(1),
      }),
      execute: safeToolExecute(async (input) => {
        if (!EMAIL_PATTERN.test(input.to)) {
          throw new Error(`Invalid recipient email: ${input.to}`);
        }

        const result = await sendEmail(userId, input);

        return JSON.stringify({
          sent: true,
          id: result.id,
          threadId: result.threadId,
          to: input.to,
          subject: input.subject,
        });
      }),
    }),

    schedule_gmail_email: tool({
      description:
        "Schedule an email to be sent later at a specific date and time. Use when the user asks to send tomorrow, next week, or at a specific time.",
      inputSchema: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().min(1),
        body: z.string().min(1),
        sendAt: z
          .string()
          .describe("ISO 8601 datetime when the email should be sent"),
      }),
      execute: safeToolExecute(async (input) => {
        if (!EMAIL_PATTERN.test(input.to)) {
          throw new Error(`Invalid recipient email: ${input.to}`);
        }

        const sendAt = new Date(input.sendAt);
        if (Number.isNaN(sendAt.getTime())) {
          throw new Error(`Invalid sendAt datetime: ${input.sendAt}`);
        }

        if (sendAt.getTime() <= Date.now()) {
          throw new Error(
            "sendAt must be in the future. Use send_gmail_email for immediate delivery.",
          );
        }

        const scheduled = await createScheduledEmail({
          userId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          sendAt,
          source: "agent",
        });

        return JSON.stringify({
          scheduled: true,
          id: scheduled.id,
          sendAt: scheduled.sendAt,
          to: input.to,
          subject: input.subject,
        });
      }),
    }),
  };
}
