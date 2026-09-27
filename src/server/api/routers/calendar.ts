import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import * as calendarService from "@/server/services/calendar.service";

const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const calendarIdInput = z.object({
  calendarId: z.string().min(1).optional(),
});

const eventFieldsInput = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  attendees: z.array(z.string().email()).optional(),
});

export const calendarRouter = createTRPCRouter({
  listCalendars: protectedProcedure.query(({ ctx }) =>
    calendarService.listCalendars(ctx.session.user.id),
  ),

  searchEvents: protectedProcedure
    .input(
      paginationSchema.extend({
        query: z.string(),
        weekStart: z.string().datetime(),
        weekEnd: z.string().datetime(),
        calendarId: z.string().min(1).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      calendarService.searchEvents(ctx.session.user.id, input),
    ),

  getEvent: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        calendarId: z.string().min(1).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      calendarService.getEvent(ctx.session.user.id, input),
    ),

  refreshEvents: protectedProcedure
    .input(
      z.object({
        weekStart: z.string().datetime(),
        weekEnd: z.string().datetime(),
        calendarId: z.string().min(1).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      calendarService.refreshEvents(ctx.session.user.id, input),
    ),

  getAvailability: protectedProcedure
    .input(
      z.object({
        timeMin: z.string().datetime(),
        timeMax: z.string().datetime(),
        calendarIds: z.array(z.string().min(1)).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      calendarService.getAvailability(ctx.session.user.id, input),
    ),

  createDraft: protectedProcedure
    .input(eventFieldsInput.extend(calendarIdInput.shape))
    .mutation(({ ctx, input }) =>
      calendarService.createDraft(ctx.session.user.id, input),
    ),

  sendInvite: protectedProcedure
    .input(
      eventFieldsInput
        .extend({
          attendees: z.array(z.string().email()).min(1),
        })
        .extend(calendarIdInput.shape),
    )
    .mutation(({ ctx, input }) =>
      calendarService.sendInvite(ctx.session.user.id, input),
    ),

  updateEvent: protectedProcedure
    .input(
      eventFieldsInput
        .extend({ id: z.string().min(1) })
        .extend(calendarIdInput.shape),
    )
    .mutation(({ ctx, input }) =>
      calendarService.updateEvent(ctx.session.user.id, input),
    ),

  deleteEvent: protectedProcedure
    .input(
      z
        .object({ id: z.string().min(1) })
        .extend(calendarIdInput.shape),
    )
    .mutation(({ ctx, input }) =>
      calendarService.deleteEvent(ctx.session.user.id, input),
    ),
});
