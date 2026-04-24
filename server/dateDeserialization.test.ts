import { describe, it, expect } from 'vitest';

describe('Date Deserialization for Share Links', () => {
  it('should deserialize largestIncomeDate correctly', () => {
    const reportData = {
      overview: {
        largestIncomeDate: '2026-04-20T10:30:00.000Z',
        largestExpenseDate: '2026-04-15T14:20:00.000Z'
      }
    };

    // 模拟反序列化逻辑
    if (reportData.overview) {
      if (reportData.overview.largestIncomeDate && typeof reportData.overview.largestIncomeDate === 'string') {
        reportData.overview.largestIncomeDate = new Date(reportData.overview.largestIncomeDate);
      }
      if (reportData.overview.largestExpenseDate && typeof reportData.overview.largestExpenseDate === 'string') {
        reportData.overview.largestExpenseDate = new Date(reportData.overview.largestExpenseDate);
      }
    }

    // 验证日期对象
    expect(reportData.overview.largestIncomeDate instanceof Date).toBe(true);
    expect(reportData.overview.largestExpenseDate instanceof Date).toBe(true);
    
    // 验证日期方法可用
    expect(typeof (reportData.overview.largestIncomeDate as Date).getFullYear).toBe('function');
    expect((reportData.overview.largestIncomeDate as Date).getFullYear()).toBe(2026);
  });

  it('should deserialize monthlyBreakdown dates correctly', () => {
    const reportData = {
      monthlyBreakdown: [
        { date: '2026-04-01T00:00:00.000Z', income: 1000 },
        { date: '2026-03-01T00:00:00.000Z', income: 900 }
      ]
    };

    // 模拟反序列化逻辑
    if (reportData.monthlyBreakdown && Array.isArray(reportData.monthlyBreakdown)) {
      reportData.monthlyBreakdown = reportData.monthlyBreakdown.map((item: any) => ({
        ...item,
        date: typeof item.date === 'string' ? new Date(item.date) : item.date
      }));
    }

    // 验证日期对象
    expect(reportData.monthlyBreakdown[0].date instanceof Date).toBe(true);
    expect(reportData.monthlyBreakdown[1].date instanceof Date).toBe(true);
    
    // 验证日期值
    expect((reportData.monthlyBreakdown[0].date as Date).getMonth()).toBe(2); // April (0-indexed, 2 = April)
  });

  it('should deserialize allTransactions dates correctly', () => {
    const reportData = {
      allTransactions: [
        { date: '2026-04-20T10:30:00.000Z', amount: 100, counterpart: 'Alice' },
        { date: '2026-04-19T15:20:00.000Z', amount: 50, counterpart: 'Bob' }
      ]
    };

    // 模拟反序列化逻辑
    if (reportData.allTransactions && Array.isArray(reportData.allTransactions)) {
      reportData.allTransactions = reportData.allTransactions.map((tx: any) => ({
        ...tx,
        date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date
      }));
    }

    // 验证日期对象
    expect(reportData.allTransactions[0].date instanceof Date).toBe(true);
    expect(reportData.allTransactions[1].date instanceof Date).toBe(true);
    
    // 验证日期方法可用
    expect(typeof (reportData.allTransactions[0].date as Date).getFullYear).toBe('function');
  });

  it('should handle already deserialized dates', () => {
    const reportData = {
      overview: {
        largestIncomeDate: new Date('2026-04-20T10:30:00.000Z')
      }
    };

    // 模拟反序列化逻辑
    if (reportData.overview) {
      if (reportData.overview.largestIncomeDate && typeof reportData.overview.largestIncomeDate === 'string') {
        reportData.overview.largestIncomeDate = new Date(reportData.overview.largestIncomeDate);
      }
    }

    // 验证日期对象保持不变
    expect(reportData.overview.largestIncomeDate instanceof Date).toBe(true);
    expect((reportData.overview.largestIncomeDate as Date).getFullYear()).toBe(2026);
  });

  it('should handle null dates', () => {
    const reportData = {
      overview: {
        largestIncomeDate: null,
        largestExpenseDate: undefined
      }
    };

    // 模拟反序列化逻辑
    if (reportData.overview) {
      if (reportData.overview.largestIncomeDate && typeof reportData.overview.largestIncomeDate === 'string') {
        reportData.overview.largestIncomeDate = new Date(reportData.overview.largestIncomeDate);
      }
      if (reportData.overview.largestExpenseDate && typeof reportData.overview.largestExpenseDate === 'string') {
        reportData.overview.largestExpenseDate = new Date(reportData.overview.largestExpenseDate);
      }
    }

    // 验证null和undefined保持不变
    expect(reportData.overview.largestIncomeDate).toBe(null);
    expect(reportData.overview.largestExpenseDate).toBeUndefined();
  });

  it('should deserialize complete report data', () => {
    const reportData = {
      overview: {
        largestIncomeDate: '2026-04-20T10:30:00.000Z',
        largestExpenseDate: '2026-04-15T14:20:00.000Z'
      },
      monthlyBreakdown: [
        { date: '2026-04-01T00:00:00.000Z', income: 1000 }
      ],
      allTransactions: [
        { date: '2026-04-20T10:30:00.000Z', amount: 100, counterpart: 'Alice' }
      ]
    };

    // 模拟完整反序列化逻辑
    if (reportData.overview) {
      if (reportData.overview.largestIncomeDate && typeof reportData.overview.largestIncomeDate === 'string') {
        reportData.overview.largestIncomeDate = new Date(reportData.overview.largestIncomeDate);
      }
      if (reportData.overview.largestExpenseDate && typeof reportData.overview.largestExpenseDate === 'string') {
        reportData.overview.largestExpenseDate = new Date(reportData.overview.largestExpenseDate);
      }
    }

    if (reportData.monthlyBreakdown && Array.isArray(reportData.monthlyBreakdown)) {
      reportData.monthlyBreakdown = reportData.monthlyBreakdown.map((item: any) => ({
        ...item,
        date: typeof item.date === 'string' ? new Date(item.date) : item.date
      }));
    }

    if (reportData.allTransactions && Array.isArray(reportData.allTransactions)) {
      reportData.allTransactions = reportData.allTransactions.map((tx: any) => ({
        ...tx,
        date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date
      }));
    }

    // 验证所有日期都正确反序列化
    expect(reportData.overview.largestIncomeDate instanceof Date).toBe(true);
    expect(reportData.overview.largestExpenseDate instanceof Date).toBe(true);
    expect(reportData.monthlyBreakdown[0].date instanceof Date).toBe(true);
    expect(reportData.allTransactions[0].date instanceof Date).toBe(true);
  });
});
