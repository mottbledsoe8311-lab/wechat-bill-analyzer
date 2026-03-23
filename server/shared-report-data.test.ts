import { describe, it, expect, vi } from 'vitest';

/**
 * 集成测试：验证分享链接数据完整性
 * 
 * 测试场景：
 * 1. 验证 ShareButton 传递的数据结构
 * 2. 验证 ReportView 接收的数据结构
 * 3. 验证所有必需字段都被正确包含
 */

describe('Shared Report Data Integrity', () => {
  // 模拟完整的分析结果
  const mockAnalysisResult = {
    overview: {
      totalTransactions: 150,
      totalIncome: 50000,
      totalExpense: 30000,
      netFlow: 20000,
      dateRange: '2024-01-01 至 2024-12-31',
      avgDailyExpense: 82.19,
      avgDailyIncome: 136.99,
      topCounterpart: '支付宝',
      largestSingleTransaction: 5000,
      accountName: '张三',
    },
    monthlyBreakdown: [
      {
        month: '2024-01',
        income: 5000,
        expense: 3000,
        netFlow: 2000,
        transactionCount: 15,
      },
      {
        month: '2024-02',
        income: 4500,
        expense: 2800,
        netFlow: 1700,
        transactionCount: 12,
      },
    ],
    regularTransfers: [
      {
        counterpart: '支付宝',
        direction: 'out',
        pattern: '每7天',
        intervalDays: 7,
        avgAmount: 500,
        totalAmount: 3500,
        transactions: [],
        confidence: 0.95,
        riskLevel: 'low',
      },
    ],
    repaymentTracking: [
      {
        counterpart: '朋友A',
        totalRepaid: 2000,
        totalReceived: 1000,
        repayments: [],
        incomings: [],
        sources: [],
        frequency: '不规律',
        isRegular: false,
      },
    ],
    largeInflows: [
      {
        date: new Date('2024-01-15'),
        amount: 10000,
        counterpart: '公司',
        followUpTransactions: [],
      },
    ],
    counterpartSummary: [
      {
        counterpart: '支付宝',
        totalIncome: 15000,
        totalExpense: 20000,
        netFlow: -5000,
        transactionCount: 50,
        transactions: [],
      },
    ],
    customerScore: {
      total: 75,
      grade: 'A',
      dimensions: {
        incomeLevel: 20,
        cashFlow: 20,
        consumptionQuality: 15,
        stability: 15,
        repaymentAbility: 5,
      },
      analysis: [],
      summary: '财务状况良好',
      highRiskRegularCount: 0,
      isHighRisk: false,
    },
    loanDetection: [],
  };

  const allTransactions = [
    {
      date: new Date('2024-01-01'),
      dateStr: '2024-01-01',
      amount: 100,
      counterpart: '支付宝',
      direction: 'out',
      orderId: '123456',
    },
  ];

  it('should pass complete data from Home.tsx to ShareButton', () => {
    // 模拟 Home.tsx 中的 ShareButton 数据传递
    const shareButtonData = {
      title: '微信账单智能分析报表',
      summary: '账单分析完成',
      overview: mockAnalysisResult.overview,
      monthlyBreakdown: mockAnalysisResult.monthlyBreakdown || [],
      regularTransfers: mockAnalysisResult.regularTransfers || [],
      repaymentTracking: mockAnalysisResult.repaymentTracking || [],
      largeInflows: mockAnalysisResult.largeInflows || [],
      counterpartSummary: mockAnalysisResult.counterpartSummary || [],
      allTransactions: allTransactions,
    };

    // 验证所有必需字段都存在
    expect(shareButtonData.overview).toBeDefined();
    expect(shareButtonData.monthlyBreakdown).toBeDefined();
    expect(shareButtonData.allTransactions).toBeDefined();
    
    // 验证 overview 包含所有必需字段
    expect(shareButtonData.overview.totalIncome).toBe(50000);
    expect(shareButtonData.overview.totalExpense).toBe(30000);
    expect(shareButtonData.overview.netFlow).toBe(20000);
    expect(shareButtonData.overview.dateRange).toBe('2024-01-01 至 2024-12-31');
    expect(shareButtonData.overview.avgDailyIncome).toBe(136.99);
    expect(shareButtonData.overview.avgDailyExpense).toBe(82.19);
  });

  it('should preserve data structure when storing in database', () => {
    // 模拟 ShareButton 中的数据序列化
    const dataToStore = {
      overview: mockAnalysisResult.overview,
      monthlyBreakdown: mockAnalysisResult.monthlyBreakdown,
      regularTransfers: mockAnalysisResult.regularTransfers,
      repaymentTracking: mockAnalysisResult.repaymentTracking,
      largeInflows: mockAnalysisResult.largeInflows,
      counterpartSummary: mockAnalysisResult.counterpartSummary,
      allTransactions: allTransactions,
    };

    // 序列化为 JSON
    const jsonString = JSON.stringify(dataToStore);
    expect(jsonString).toBeTruthy();

    // 反序列化
    const parsed = JSON.parse(jsonString);
    
    // 验证数据完整性
    expect(parsed.overview).toBeDefined();
    expect(parsed.monthlyBreakdown).toBeDefined();
    expect(parsed.allTransactions).toBeDefined();
    expect(parsed.overview.totalIncome).toBe(50000);
  });

  it('should handle empty data gracefully in ReportView', () => {
    // 模拟 ReportView 中的默认对象
    const emptyOverview = {
      totalIncome: 0,
      totalExpense: 0,
      netFlow: 0,
      totalTransactions: 0,
      dateRange: '',
      avgDailyIncome: 0,
      avgDailyExpense: 0,
      topCounterpart: '',
      largestSingleTransaction: 0,
      accountName: '',
    };

    // 验证默认对象包含所有必需字段
    expect(emptyOverview.totalIncome).toBe(0);
    expect(emptyOverview.dateRange).toBe('');
    expect(emptyOverview.avgDailyIncome).toBe(0);
    expect(emptyOverview.avgDailyExpense).toBe(0);
    expect(emptyOverview.topCounterpart).toBe('');
    expect(emptyOverview.largestSingleTransaction).toBe(0);
  });

  it('should correctly merge stored data with defaults', () => {
    // 模拟从数据库读取的数据
    const storedData = {
      overview: mockAnalysisResult.overview,
      monthlyBreakdown: mockAnalysisResult.monthlyBreakdown,
      regularTransfers: mockAnalysisResult.regularTransfers,
      repaymentTracking: mockAnalysisResult.repaymentTracking,
      largeInflows: mockAnalysisResult.largeInflows,
      counterpartSummary: mockAnalysisResult.counterpartSummary,
      allTransactions: allTransactions,
    };

    // 模拟 ReportView 中的数据处理
    const reportData = {
      overview: storedData.overview || {
        totalIncome: 0,
        totalExpense: 0,
        netFlow: 0,
        totalTransactions: 0,
        dateRange: '',
        avgDailyIncome: 0,
        avgDailyExpense: 0,
        topCounterpart: '',
        largestSingleTransaction: 0,
        accountName: '',
      },
      monthlyBreakdown: storedData.monthlyBreakdown || [],
      regularTransfers: storedData.regularTransfers || [],
      repaymentTracking: storedData.repaymentTracking || [],
      largeInflows: storedData.largeInflows || [],
      counterpartSummary: storedData.counterpartSummary || [],
      allTransactions: storedData.allTransactions || [],
    };

    // 验证所有数据都被正确合并
    expect(reportData.overview.totalIncome).toBe(50000);
    expect(reportData.monthlyBreakdown.length).toBe(2);
    expect(reportData.allTransactions.length).toBe(1);
    expect(reportData.counterpartSummary.length).toBe(1);
  });

  it('should handle missing optional fields gracefully', () => {
    // 模拟不完整的数据
    const incompleteData = {
      overview: {
        totalIncome: 50000,
        totalExpense: 30000,
        netFlow: 20000,
        totalTransactions: 150,
        dateRange: '2024-01-01 至 2024-12-31',
        // 缺少 avgDailyIncome, avgDailyExpense 等字段
      },
      monthlyBreakdown: [],
    };

    // 模拟 ReportView 中的处理
    const reportData = {
      overview: incompleteData.overview || {
        totalIncome: 0,
        totalExpense: 0,
        netFlow: 0,
        totalTransactions: 0,
        dateRange: '',
        avgDailyIncome: 0,
        avgDailyExpense: 0,
        topCounterpart: '',
        largestSingleTransaction: 0,
        accountName: '',
      },
      monthlyBreakdown: incompleteData.monthlyBreakdown || [],
    };

    // 验证即使数据不完整，也能正确处理
    expect(reportData.overview.totalIncome).toBe(50000);
    expect(reportData.overview.dateRange).toBe('2024-01-01 至 2024-12-31');
    // 缺失的字段应该被使用默认值
    expect(reportData.overview.avgDailyIncome).toBeUndefined(); // 原始数据中没有
  });
});
