import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import * as gmailService from "@/server/services/gmail.service";

const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const emailFieldsSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const draftFieldsSchema = z
  .object({
    to: z.string().default(""),
    subject: z.string().default(""),
    body: z.string().default(""),
  })
  .refine(
    (fields) =>
      fields.to.trim().length > 0 ||
      fields.subject.trim().length > 0 ||
      fields.body.trim().length > 0,
    { message: "Draft must have at least one field filled in" },
  );

const messageIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const gmailRouter = createTRPCRouter({
  searchEmails: protectedProcedure
    .input(
      paginationSchema.extend({
        query: z.string(),
      }),
    )
    .query(({ ctx, input }) =>
      gmailService.searchEmails(ctx.session.user.id, input),
    ),

  getMessage: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) =>
      gmailService.getMessage(ctx.session.user.id, input.id),
    ),

  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().min(1) }))
    .query(({ ctx, input }) =>
      gmailService.getThread(ctx.session.user.id, input.threadId),
    ),

  getMessageWithThread: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) =>
      gmailService.getMessageWithThread(ctx.session.user.id, input.id),
    ),

  listDrafts: protectedProcedure
    .input(paginationSchema)
    .query(({ ctx, input }) =>
      gmailService.listDrafts(ctx.session.user.id, input),
    ),

  getDraftCount: protectedProcedure.query(({ ctx }) =>
    gmailService.getDraftCount(ctx.session.user.id),
  ),

  listSent: protectedProcedure
    .input(paginationSchema)
    .query(({ ctx, input }) =>
      gmailService.listSentEmails(ctx.session.user.id, input),
    ),

  listStarred: protectedProcedure
    .input(paginationSchema)
    .query(({ ctx, input }) =>
      gmailService.listStarredEmails(ctx.session.user.id, input),
    ),

  listByLabel: protectedProcedure
    .input(
      paginationSchema.extend({
        labelId: z.string().min(1),
      }),
    )
    .query(({ ctx, input }) =>
      gmailService.listEmailsByLabel(ctx.session.user.id, input),
    ),

  listLabels: protectedProcedure.query(({ ctx }) =>
    gmailService.listLabels(ctx.session.user.id),
  ),

  refreshInbox: protectedProcedure.mutation(({ ctx }) =>
    gmailService.refreshInbox(ctx.session.user.id),
  ),

  refreshDrafts: protectedProcedure.mutation(({ ctx }) =>
    gmailService.refreshDrafts(ctx.session.user.id),
  ),

  modifyMessages: protectedProcedure
    .input(
      messageIdsSchema.extend({
        addLabelIds: z.array(z.string()).optional(),
        removeLabelIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      gmailService.modifyMessages(ctx.session.user.id, input),
    ),

  archiveMessages: protectedProcedure
    .input(messageIdsSchema)
    .mutation(({ ctx, input }) =>
      gmailService.archiveMessages(ctx.session.user.id, input.ids),
    ),

  trashMessages: protectedProcedure
    .input(messageIdsSchema)
    .mutation(({ ctx, input }) =>
      gmailService.trashMessages(ctx.session.user.id, input.ids),
    ),

  createDraft: protectedProcedure
    .input(draftFieldsSchema)
    .mutation(({ ctx, input }) =>
      gmailService.createDraft(ctx.session.user.id, input),
    ),

  getDraft: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ ctx, input }) =>
      gmailService.getDraft(ctx.session.user.id, input.id),
    ),

  updateDraft: protectedProcedure
    .input(
      draftFieldsSchema.extend({
        id: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) =>
      gmailService.updateDraft(ctx.session.user.id, input),
    ),

  deleteDraft: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      gmailService.deleteDraft(ctx.session.user.id, input.id),
    ),

  sendDraft: protectedProcedure
    .input(z.object({ draftId: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      gmailService.sendDraft(ctx.session.user.id, input.draftId),
    ),

  sendEmail: protectedProcedure
    .input(emailFieldsSchema)
    .mutation(({ ctx, input }) =>
      gmailService.sendEmail(ctx.session.user.id, input),
    ),
});
