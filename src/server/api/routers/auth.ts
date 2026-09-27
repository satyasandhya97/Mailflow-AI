import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { OTP_LENGTH } from "@/features/auth/constants/auth.constants";
import {
  clearSessionCookie,
  getSessionTokenFromCookies,
  setSessionCookie,
} from "@/server/auth/session-cookie";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import * as authService from "@/server/services/auth.service";

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const flowSchema = z.enum(["signup", "login"]);

function toTrpcError(error: unknown): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "Something went wrong",
  });
}

export const authRouter = createTRPCRouter({
  sendOtp: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        flow: flowSchema,
        fullName: z.string().trim().min(2).max(80).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await authService.sendOtp({
          email: input.email,
          flow: input.flow,
          fullName: input.fullName,
        });
      } catch (error) {
        toTrpcError(error);
      }
    }),

  resendOtp: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        flow: flowSchema,
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await authService.resendOtp(input.email, input.flow);
      } catch (error) {
        toTrpcError(error);
      }
    }),

  verifyOtp: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        flow: flowSchema,
        otp: z
          .string()
          .length(OTP_LENGTH, `OTP must be ${OTP_LENGTH} digits`)
          .regex(/^\d+$/, `OTP must be ${OTP_LENGTH} digits`),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await authService.verifyOtp(input);
        await setSessionCookie(result.token);
        return {
          user: result.user,
        };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  logout: publicProcedure.mutation(async () => {
    const token = await getSessionTokenFromCookies();
    await authService.logout(token);
    await clearSessionCookie();
    return { success: true as const };
  }),

  me: protectedProcedure.query(({ ctx }) => ctx.session.user),
});
