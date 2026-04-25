import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Share Link Integration Test', () => {
  // 模拟报表数据
  const mockAnalysisResult = {
    overview: {
      totalIncome: 50000,
      totalExpense: 30000,
      largestIncomeDate: new Date('2026-04-01'),
      largestExpenseDate: new Date('2026-04-15'),
      largestIncome: 5000,
      largestExpense: 3000,
    },
    monthlyBreakdown: [
      {
        month: 'April 2026',
        date: new Date('2026-04-01'),
        income: 50000,
        expense: 30000,
      },
    ],
    allTransactions: [
      {
        date: new Date('2026-04-01'),
        amount: 1000,
        type: 'income',
        counterpart: 'Customer A',
        description: 'Payment received',
      },
      {
        date: new Date('2026-04-15'),
        amount: 500,
        type: 'expense',
        counterpart: 'Vendor B',
        description: 'Payment sent',
      },
    ],
    repaymentTracking: [
      {
        counterpart: 'Debtor C',
        isRegular: true,
        totalRepaid: 10000,
        repayments: [
          {
            date: new Date('2026-04-01'),
            amount: 5000,
            description: 'Repayment 1',
          },
          {
            date: new Date('2026-04-15'),
            amount: 5000,
            description: 'Repayment 2',
          },
        ],
      },
    ],
    largeInflows: [
      {
        date: new Date('2026-04-01'),
        amount: 5000,
        counterpart: 'Customer A',
        description: 'Large income',
      },
    ],
    regularTransfers: [
      {
        counterpart: 'Regular Partner',
        frequency: 'Weekly',
        amount: 1000,
        lastDate: new Date('2026-04-20'),
      },
    ],
  };

  it('should serialize and deserialize report data correctly', () => {
    // 序列化报表数据
    const serialized = JSON.stringify(mockAnalysisResult);
    
    // 验证序列化后日期变成了字符串
    const parsed = JSON.parse(serialized);
    expect(typeof parsed.overview.largestIncomeDate).toBe('string');
    expect(typeof parsed.monthlyBreakdown[0].date).toBe('string');
    expect(typeof parsed.allTransactions[0].date).toBe('string');
    expect(typeof parsed.repaymentTracking[0].repayments[0].date).toBe('string');
    expect(typeof parsed.largeInflows[0].date).toBe('string');
    expect(typeof parsed.regularTransfers[0].lastDate).toBe('string');
  });

  it('should deserialize all date fields correctly', () => {
    // 序列化
    const serialized = JSON.stringify(mockAnalysisResult);
    const data = JSON.parse(serialized);

    // 反序列化（模拟ReportView中的逻辑）
    if (data.overview) {
      if (data.overview.largestIncomeDate && typeof data.overview.largestIncomeDate === 'string') {
        data.overview.largestIncomeDate = new Date(data.overview.largestIncomeDate);
      }
      if (data.overview.largestExpenseDate && typeof data.overview.largestExpenseDate === 'string') {
        data.overview.largestExpenseDate = new Date(data.overview.largestExpenseDate);
      }
    }

    if (data.monthlyBreakdown && Array.isArray(data.monthlyBreakdown)) {
      data.monthlyBreakdown = data.monthlyBreakdown.map((item: any) => ({
        ...item,
        date: typeof item.date === 'string' ? new Date(item.date) : item.date,
      }));
    }

    if (data.allTransactions && Array.isArray(data.allTransactions)) {
      data.allTransactions = data.allTransactions.map((tx: any) => ({
        ...tx,
        date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date,
      }));
    }

    if (data.repaymentTracking && Array.isArray(data.repaymentTracking)) {
      data.repaymentTracking = data.repaymentTracking.map((record: any) => ({
        ...record,
        repayments: Array.isArray(record.repayments)
          ? record.repayments.map((r: any) => ({
              ...r,
              date: typeof r.date === 'string' ? new Date(r.date) : r.date,
            }))
          : [],
      }));
    }

    if (data.largeInflows && Array.isArray(data.largeInflows)) {
      data.largeInflows = data.largeInflows.map((item: any) => ({
        ...item,
        date: typeof item.date === 'string' ? new Date(item.date) : item.date,
      }));
    }

    if (data.regularTransfers && Array.isArray(data.regularTransfers)) {
      data.regularTransfers = data.regularTransfers.map((item: any) => ({
        ...item,
        lastDate: typeof item.lastDate === 'string' ? new Date(item.lastDate) : item.lastDate,
      }));
    }

    // 验证所有日期都被正确反序列化
    expect(data.overview.largestIncomeDate instanceof Date).toBe(true);
    expect(data.overview.largestExpenseDate instanceof Date).toBe(true);
    expect(data.monthlyBreakdown[0].date instanceof Date).toBe(true);
    expect(data.allTransactions[0].date instanceof Date).toBe(true);
    expect(data.repaymentTracking[0].repayments[0].date instanceof Date).toBe(true);
    expect(data.largeInflows[0].date instanceof Date).toBe(true);
    expect(data.regularTransfers[0].lastDate instanceof Date).toBe(true);
  });

  it('should handle RepaymentTracking sorting with deserialized dates', () => {
    // 序列化和反序列化
    const serialized = JSON.stringify(mockAnalysisResult);
    const data = JSON.parse(serialized);

    // 反序列化repaymentTracking
    if (data.repaymentTracking && Array.isArray(data.repaymentTracking)) {
      data.repaymentTracking = data.repaymentTracking.map((record: any) => ({
        ...record,
        repayments: Array.isArray(record.repayments)
          ? record.repayments.map((r: any) => ({
              ...r,
              date: typeof r.date === 'string' ? new Date(r.date) : r.date,
            }))
          : [],
      }));
    }

    // 模拟RepaymentTracking组件的排序逻辑
    const records = data.repaymentTracking;
    const filtered = records.filter((r: any) => r.isRegular && r.repayments.length >= 2);

    const sorted = [...filtered].sort((a: any, b: any) => {
      const aLatest = Math.max(
        ...a.repayments.map((t: any) => {
          const date = typeof t.date === 'string' ? new Date(t.date) : t.date;
          return date instanceof Date ? date.getTime() : 0;
        })
      );
      const bLatest = Math.max(
        ...b.repayments.map((t: any) => {
          const date = typeof t.date === 'string' ? new Date(t.date) : t.date;
          return date instanceof Date ? date.getTime() : 0;
        })
      );
      return bLatest - aLatest;
    });

    // 验证排序成功，没有抛出错误
    expect(sorted.length).toBe(1);
    expect(sorted[0].counterpart).toBe('Debtor C');
  });

  it('should handle mixed date types (string and Date objects)', () => {
    // 创建混合的数据（某些字段是字符串，某些是Date对象）
    const mixedData = {
      repaymentTracking: [
        {
          counterpart: 'Mixed Partner',
          isRegular: true,
          totalRepaid: 10000,
          repayments: [
            {
              date: '2026-04-01T00:00:00.000Z', // 字符串
              amount: 5000,
            },
            {
              date: new Date('2026-04-15'), // Date对象
              amount: 5000,
            },
          ],
        },
      ],
    };

    // 模拟排序逻辑
    const records = mixedData.repaymentTracking;
    const filtered = records.filter((r: any) => r.isRegular && r.repayments.length >= 2);

    const sorted = [...filtered].sort((a: any, b: any) => {
      const aLatest = Math.max(
        ...a.repayments.map((t: any) => {
          const date = typeof t.date === 'string' ? new Date(t.date) : t.date;
          return date instanceof Date ? date.getTime() : 0;
        })
      );
      const bLatest = Math.max(
        ...b.repayments.map((t: any) => {
          const date = typeof t.date === 'string' ? new Date(t.date) : t.date;
          return date instanceof Date ? date.getTime() : 0;
        })
      );
      return bLatest - aLatest;
    });

    // 验证混合类型也能正确处理
    expect(sorted.length).toBe(1);
    expect(sorted[0].repayments[0].date).toBe('2026-04-01T00:00:00.000Z');
    expect(sorted[0].repayments[1].date instanceof Date).toBe(true);
  });

  it('should verify report content consistency after serialization', () => {
    // 原始数据
    const original = mockAnalysisResult;

    // 序列化和反序列化
    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized);

    // 反序列化所有日期
    if (deserialized.overview) {
      if (deserialized.overview.largestIncomeDate && typeof deserialized.overview.largestIncomeDate === 'string') {
        deserialized.overview.largestIncomeDate = new Date(deserialized.overview.largestIncomeDate);
      }
      if (deserialized.overview.largestExpenseDate && typeof deserialized.overview.largestExpenseDate === 'string') {
        deserialized.overview.largestExpenseDate = new Date(deserialized.overview.largestExpenseDate);
      }
    }

    if (deserialized.allTransactions && Array.isArray(deserialized.allTransactions)) {
      deserialized.allTransactions = deserialized.allTransactions.map((tx: any) => ({
        ...tx,
        date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date,
      }));
    }

    // 验证内容一致性
    expect(deserialized.overview.totalIncome).toBe(original.overview.totalIncome);
    expect(deserialized.overview.totalExpense).toBe(original.overview.totalExpense);
    expect(deserialized.allTransactions.length).toBe(original.allTransactions.length);
    expect(deserialized.allTransactions[0].amount).toBe(original.allTransactions[0].amount);
    expect(deserialized.allTransactions[0].counterpart).toBe(original.allTransactions[0].counterpart);
  });
});
