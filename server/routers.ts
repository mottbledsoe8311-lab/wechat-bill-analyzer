import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createReport, getReportById } from "./db";
import { randomUUID } from "crypto";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 报表相关路由
  reports: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        data: z.any(),
        allTransactions: z.array(z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const reportId = randomUUID().substring(0, 12);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const reportData = {
            ...input.data,
            allTransactions: input.allTransactions || [],
          };

          const report = await createReport({
            id: reportId,
            userId: ctx.user.id,
            title: input.title,
            data: JSON.stringify(reportData),
            expiresAt,
          });

          return {
            success: true,
            reportId: report?.id,
            shareUrl: `/report/${report?.id}`,
          };
        } catch (error) {
          console.error('Failed to create report:', error);
          throw new Error('Failed to create report');
        }
      }),
    
    get: publicProcedure
      .input(z.object({
        reportId: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const report = await getReportById(input.reportId);
          
          if (!report) {
            throw new Error('Report not found');
          }

          if (new Date() > report.expiresAt) {
            throw new Error('Report has expired');
          }

          return {
            success: true,
            title: report.title,
            data: report.data,
          };
        } catch (error) {
          console.error('Failed to get report:', error);
          throw new Error('Failed to get report');
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
