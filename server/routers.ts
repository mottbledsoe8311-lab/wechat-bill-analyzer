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
    create: publicProcedure
      .input(z.object({
        title: z.string(),
        data: z.any(),
        allTransactions: z.array(z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log('[tRPC] Creating report - user:', ctx.user?.id || 'anonymous');
          
          const reportId = randomUUID().substring(0, 12);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const reportData = {
            ...input.data,
            allTransactions: input.allTransactions || [],
          };

          console.log('[tRPC] Report data size:', JSON.stringify(reportData).length);

          const report = await createReport({
            id: reportId,
            userId: ctx.user?.id || null,
            title: input.title,
            data: JSON.stringify(reportData),
            expiresAt,
          });

          if (!report || !report.id) {
            console.error('[tRPC] Failed to create report: report is undefined or has no id');
            throw new Error('Failed to create report: database operation failed');
          }

          const shareUrl = `${process.env.VITE_FRONTEND_URL || 'https://vixi.manus.space'}/report/${report.id}`;
          console.log('[tRPC] Report created successfully:', report.id, 'Share URL:', shareUrl);
          return {
            success: true,
            reportId: report.id,
            shareUrl: shareUrl,
          };
        } catch (error: any) {
          console.error('[tRPC] Failed to create report:', error?.message || error);
          throw new Error(error?.message || 'Failed to create report');
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

          if (report.expiresAt < new Date()) {
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

  // 反馈相关路由
  feedback: router({
    submit: publicProcedure
      .input(z.object({
        text: z.string().min(1, '反馈内容不能为空'),
        imageUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          console.log('[tRPC] Submitting feedback - user:', ctx.user?.id || 'anonymous');
          
          // 调用 notifyOwner 向开发者发送应用内通知
          const { notifyOwner } = await import('./_core/notification');
          
          const feedbackContent = `
用户反馈：
${input.text}
${input.imageUrls && input.imageUrls.length > 0 ? `\n图片：${input.imageUrls.join(', ')}` : ''}
用户ID：${ctx.user?.id || '匿名'}
时间：${new Date().toLocaleString('zh-CN')}
          `.trim();
          
          const success = await notifyOwner({
            title: '📬 新用户反馈',
            content: feedbackContent,
          });
          
          console.log('[tRPC] Feedback notification sent:', success);
          
          return {
            success: true,
            message: '感谢您的反馈！我们会尽快查看',
          };
        } catch (error: any) {
          console.error('[tRPC] Failed to submit feedback:', error?.message || error);
          throw new Error(error?.message || 'Failed to submit feedback');
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
