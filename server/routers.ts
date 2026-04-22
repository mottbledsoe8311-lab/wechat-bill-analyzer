import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createReport, getReportById, saveRiskAccount, getRiskAccountByName, getAllRiskAccounts, getAllFootprintKeywords, saveFootprintKeyword, deleteFootprintKeyword, getAllRepaymentKeywords, saveRepaymentKeyword, deleteRepaymentKeyword, incrementUploadCount, incrementShareCount, incrementPvCount, getDailyStats, recordVisitorUpload, recordVisitorVisit, getVisitorStats, getVisitorSummary } from "./db";
import { randomUUID } from "crypto";
import { COOKIE_NAME } from "../shared/const";

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
          // 设置有效期为 48 小时
          expiresAt.setHours(expiresAt.getHours() + 48);

          // 确保所有字段都被保存
          const reportData = {
            overview: input.data.overview,
            monthlyBreakdown: input.data.monthlyBreakdown || [],
            regularTransfers: input.data.regularTransfers || [],
            repaymentTracking: input.data.repaymentTracking || [],
            largeInflows: input.data.largeInflows || [],
            largeExpenses: input.data.largeExpenses || [],
            counterpartSummary: input.data.counterpartSummary || [],
            allTransactions: input.allTransactions || input.data.allTransactions || [],
          };

          // 详细日志：验证所有字段都被保存
          console.log('[tRPC] Report data fields:', {
            hasOverview: !!reportData.overview,
            hasMonthlyBreakdown: reportData.monthlyBreakdown?.length > 0,
            hasRegularTransfers: reportData.regularTransfers?.length > 0,
            hasRepaymentTracking: reportData.repaymentTracking?.length > 0,
            hasLargeInflows: reportData.largeInflows?.length > 0,
            hasLargeExpenses: reportData.largeExpenses?.length > 0,
            hasCounterpartSummary: reportData.counterpartSummary?.length > 0,
            hasAllTransactions: reportData.allTransactions?.length > 0,
          });
          console.log('[tRPC] Report data size:', JSON.stringify(reportData).length);
          console.log('[tRPC] Overview data:', reportData.overview ? { totalIncome: reportData.overview.totalIncome, totalExpense: reportData.overview.totalExpense } : 'missing');
          console.log('[tRPC] Monthly breakdown count:', reportData.monthlyBreakdown?.length || 0);

          const report = await createReport({
            id: reportId,
            userId: ctx.user?.id || null,
            title: input.title,
            data: reportData, // 传入对象，让 Drizzle 自动 JSON 序列化
            expiresAt,
          });

          if (!report || !report.id) {
            console.error('[tRPC] Failed to create report: report is undefined or has no id');
            throw new Error('Failed to create report: database operation failed');
          }

          // 记录访客上传数据
          const visitorId = ctx.user?.id || 'anonymous';
          await recordVisitorUpload(visitorId);

          // 只返回相对路径，让前端根据 origin 拼接
          const sharePath = `/report/${report.id}`;
          console.log('[tRPC] Report created successfully:', report.id, 'Share path:', sharePath);
          return {
            success: true,
            reportId: report.id,
            sharePath: sharePath, // 相对路径
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
      .query(async ({ input, ctx }) => {
        try {
          // 记录访客访问数据
          const visitorId = ctx.user?.id || 'anonymous';
          await recordVisitorVisit(visitorId);

          const report = await getReportById(input.reportId);
          
          if (!report) {
            throw new Error('Report not found');
          }

          if (report.expiresAt < new Date()) {
            throw new Error('Report has expired');
          }

          // 确保 data 是对象，如果是字符串则解析
          let parsedData = report.data;
          if (typeof report.data === 'string') {
            try {
              parsedData = JSON.parse(report.data);
            } catch (e) {
              console.error('Failed to parse report data:', e);
              parsedData = report.data;
            }
          }

          return {
            success: true,
            title: report.title,
            data: parsedData,
          };
        } catch (error) {
          console.error('Failed to get report:', error);
          throw new Error('Failed to get report');
        }
      }),
  }),

  // 高风险账户相关路由
  riskAccounts: router({
    save: publicProcedure
      .input(z.object({
        accountName: z.string(),
        riskLevel: z.enum(["high", "medium", "low"]),
        regularity: z.number().min(0).max(100),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          console.log('[tRPC] Saving risk account:', input.accountName);
          
          const result = await saveRiskAccount({
            accountName: input.accountName,
            riskLevel: input.riskLevel,
            regularity: input.regularity,
            description: input.description,
          });
          
          return {
            success: true,
            data: result,
          };
        } catch (error: any) {
          console.error('[tRPC] Failed to save risk account:', error?.message || error);
          throw new Error(error?.message || 'Failed to save risk account');
        }
      }),
    
    getByName: publicProcedure
      .input(z.object({
        accountName: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          console.log('[tRPC] Getting risk account:', input.accountName);
          
          const result = await getRiskAccountByName(input.accountName);
          
          return {
            success: true,
            data: result,
          };
        } catch (error: any) {
          console.error('[tRPC] Failed to get risk account:', error?.message || error);
          throw new Error(error?.message || 'Failed to get risk account');
        }
      }),
    
    getAll: publicProcedure
      .query(async () => {
        try {
          console.log('[tRPC] Getting all risk accounts');
          
          const result = await getAllRiskAccounts();
          
          return {
            success: true,
            data: result,
          };
        } catch (error: any) {
          console.error('[tRPC] Failed to get all risk accounts:', error?.message || error);
          throw new Error(error?.message || 'Failed to get all risk accounts');
        }
      }),
  }),

  // 足迹关键词管理路由
  footprintKeywords: router({
    getAll: publicProcedure
      .query(async () => {
        try {
          const result = await getAllFootprintKeywords();
          return { success: true, data: result };
        } catch (error: any) {
          throw new Error(error?.message || 'Failed to get footprint keywords');
        }
      }),
    save: publicProcedure
      .input(z.object({
        keyword: z.string().min(1),
        category: z.enum(["parking", "property", "transit"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await saveFootprintKeyword(input);
          return { success: true, data: result };
        } catch (error: any) {
          throw new Error(error?.message || 'Failed to save footprint keyword');
        }
      }),
    delete: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await deleteFootprintKeyword(input.keyword);
          return { success: true };
        } catch (error: any) {
          throw new Error(error?.message || 'Failed to delete footprint keyword');
        }
      }),
  }),

  // 规律转账疑似还款账户关键词管理路由
  repaymentKeywords: router({
    getAll: publicProcedure
      .query(async () => {
        try {
          const result = await getAllRepaymentKeywords();
          return { success: true, data: result };
        } catch (error: any) {
          throw new Error(error?.message || 'Failed to get repayment keywords');
        }
      }),
    save: publicProcedure
      .input(z.object({
        keyword: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await saveRepaymentKeyword(input);
          return { success: true, data: result };
        } catch (error: any) {
          throw new Error(error?.message || 'Failed to save repayment keyword');
        }
      }),
    delete: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await deleteRepaymentKeyword(input.keyword);
          return { success: true };
        } catch (error: any) {
          throw new Error(error?.message || 'Failed to delete repayment keyword');
        }
      }),
  }),

  // 每日统计路由
  stats: router({
    // 记录一次上传
    recordUpload: publicProcedure
      .mutation(async () => {
        await incrementUploadCount();
        return { success: true };
      }),
    // 记录一次分享
    recordShare: publicProcedure
      .mutation(async () => {
        await incrementShareCount();
        return { success: true };
      }),
    // 记录一次页面访问（PV）
    recordPv: publicProcedure
      .mutation(async () => {
        await incrementPvCount();
        return { success: true };
      }),
    // 获取近 N 天统计（管理员用）
    getDaily: publicProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(14) }))
      .query(async ({ input }) => {
        const data = await getDailyStats(input.days);
        return { success: true, data };
      }),
    // 获取访客统计数据
    getVisitorStats: publicProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(14) }))
      .query(async ({ input }) => {
        const data = await getVisitorStats(input.days);
        return { success: true, data };
      }),
    // 获取访客统计摘要
    getVisitorSummary: publicProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(14) }))
      .query(async ({ input }) => {
        const data = await getVisitorSummary(input.days);
        return { success: true, data };
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
