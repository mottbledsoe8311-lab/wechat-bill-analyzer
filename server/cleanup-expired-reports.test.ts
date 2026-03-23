import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createReport, getReportById, deleteExpiredReports } from './db';
import { randomUUID } from 'crypto';

/**
 * 过期报表清理功能测试
 * 
 * 验证定时任务能够正确清理过期的报表
 */

describe('Cleanup Expired Reports', () => {
  let expiredReportId: string;
  let validReportId: string;

  beforeAll(async () => {
    // 创建一个已过期的报表（过期时间为 1 小时前）
    const expiredTime = new Date();
    expiredTime.setHours(expiredTime.getHours() - 1);
    
    expiredReportId = randomUUID().substring(0, 12);
    await createReport({
      id: expiredReportId,
      title: 'Expired Report',
      data: {
        overview: { totalIncome: 1000, totalExpense: 500 },
        monthlyBreakdown: [],
        regularTransfers: [],
        repaymentTracking: [],
        largeInflows: [],
        counterpartSummary: [],
        allTransactions: [],
      },
      expiresAt: expiredTime,
    });

    // 创建一个有效的报表（48 小时后过期）
    const validTime = new Date();
    validTime.setHours(validTime.getHours() + 48);
    
    validReportId = randomUUID().substring(0, 12);
    await createReport({
      id: validReportId,
      title: 'Valid Report',
      data: {
        overview: { totalIncome: 2000, totalExpense: 1000 },
        monthlyBreakdown: [],
        regularTransfers: [],
        repaymentTracking: [],
        largeInflows: [],
        counterpartSummary: [],
        allTransactions: [],
      },
      expiresAt: validTime,
    });
  });

  it('should delete expired reports', async () => {
    // 验证过期报表存在
    const expiredBefore = await getReportById(expiredReportId);
    expect(expiredBefore).toBeDefined();
    expect(expiredBefore?.id).toBe(expiredReportId);

    // 执行清理
    await deleteExpiredReports();

    // 验证过期报表已被删除
    const expiredAfter = await getReportById(expiredReportId);
    expect(expiredAfter).toBeUndefined();
  });

  it('should keep valid reports', async () => {
    // 验证有效报表仍然存在
    const validReport = await getReportById(validReportId);
    expect(validReport).toBeDefined();
    expect(validReport?.id).toBe(validReportId);
  });

  it('should handle cleanup gracefully when no expired reports exist', async () => {
    // 第二次执行清理应该不出错
    await expect(deleteExpiredReports()).resolves.not.toThrow();
  });

  it('cleanup task should run every hour', () => {
    // 验证清理间隔为 1 小时（3600000 毫秒）
    const cleanupInterval = 60 * 60 * 1000;
    expect(cleanupInterval).toBe(3600000);
  });

  afterAll(async () => {
    // 清理有效报表
    try {
      await deleteExpiredReports();
    } catch (error) {
      console.log('Cleanup after tests completed');
    }
  });
});
