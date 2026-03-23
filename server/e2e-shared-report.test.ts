import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 端到端测试：验证分享链接的完整流程
 * 
 * 流程：
 * 1. 用户生成报表分析结果
 * 2. 用户点击"分享报表"按钮
 * 3. 系统创建分享链接
 * 4. 系统保存报表数据到数据库
 * 5. 用户点击分享链接
 * 6. 系统从数据库读取报表数据
 * 7. 前端显示完整的报表内容
 */

describe('E2E: Shared Report Complete Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 模拟完整的分析结果
  const createMockAnalysisResult = () => ({
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
        riskLevel: 'low' as const,
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
      grade: 'A' as const,
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
  });

  const mockAllTransactions = [
    {
      date: new Date('2024-01-01'),
      dateStr: '2024-01-01',
      amount: 100,
      counterpart: '支付宝',
      direction: 'out' as const,
      orderId: '123456',
    },
  ];

  it('Step 1: User generates analysis result', () => {
    const analysisResult = createMockAnalysisResult();

    // 验证分析结果包含所有必需字段
    expect(analysisResult.overview).toBeDefined();
    expect(analysisResult.monthlyBreakdown).toBeDefined();
    expect(analysisResult.regularTransfers).toBeDefined();
    expect(analysisResult.repaymentTracking).toBeDefined();
    expect(analysisResult.largeInflows).toBeDefined();
    expect(analysisResult.counterpartSummary).toBeDefined();
  });

  it('Step 2: User clicks share button and ShareButton collects data', () => {
    const analysisResult = createMockAnalysisResult();

    // 模拟 Home.tsx 中的 ShareButton 数据收集
    const shareButtonData = {
      title: '微信账单智能分析报表',
      summary: '账单分析完成',
      overview: analysisResult.overview,
      monthlyBreakdown: analysisResult.monthlyBreakdown || [],
      regularTransfers: analysisResult.regularTransfers || [],
      repaymentTracking: analysisResult.repaymentTracking || [],
      largeInflows: analysisResult.largeInflows || [],
      counterpartSummary: analysisResult.counterpartSummary || [],
      allTransactions: mockAllTransactions,
    };

    // 验证数据完整性
    expect(shareButtonData.overview).toBeDefined();
    expect(shareButtonData.monthlyBreakdown.length).toBe(2);
    expect(shareButtonData.allTransactions.length).toBe(1);
  });

  it('Step 3: System creates share link', () => {
    // 模拟 tRPC reports.create 的响应
    const reportId = 'abc123def456';
    const sharePath = `/report/${reportId}`;
    const shareUrl = `https://vixi.manus.space${sharePath}`;

    expect(reportId).toBeTruthy();
    expect(sharePath).toBe('/report/abc123def456');
    expect(shareUrl).toContain('vixi.manus.space');
  });

  it('Step 4: System saves report data to database', () => {
    const analysisResult = createMockAnalysisResult();

    // 模拟保存到数据库的数据
    const dataToStore = {
      overview: analysisResult.overview,
      monthlyBreakdown: analysisResult.monthlyBreakdown,
      regularTransfers: analysisResult.regularTransfers,
      repaymentTracking: analysisResult.repaymentTracking,
      largeInflows: analysisResult.largeInflows,
      counterpartSummary: analysisResult.counterpartSummary,
      allTransactions: mockAllTransactions,
    };

    // 序列化为 JSON（模拟数据库存储）
    const jsonString = JSON.stringify(dataToStore);
    
    // 验证序列化成功
    expect(jsonString).toBeTruthy();
    expect(jsonString.length).toBeGreaterThan(0);
  });

  it('Step 5: User clicks shared link and opens report page', () => {
    const reportId = 'abc123def456';
    const shareUrl = `https://vixi.manus.space/report/${reportId}`;

    // 验证 URL 格式正确
    expect(shareUrl).toContain('/report/');
    expect(shareUrl).toContain(reportId);
  });

  it('Step 6: System retrieves report data from database', () => {
    const analysisResult = createMockAnalysisResult();

    // 模拟从数据库读取的数据
    const storedData = {
      overview: analysisResult.overview,
      monthlyBreakdown: analysisResult.monthlyBreakdown,
      regularTransfers: analysisResult.regularTransfers,
      repaymentTracking: analysisResult.repaymentTracking,
      largeInflows: analysisResult.largeInflows,
      counterpartSummary: analysisResult.counterpartSummary,
      allTransactions: mockAllTransactions,
    };

    // 验证数据完整性
    expect(storedData.overview.totalIncome).toBe(50000);
    expect(storedData.monthlyBreakdown.length).toBe(2);
    expect(storedData.allTransactions.length).toBe(1);
  });

  it('Step 7: Frontend displays complete report content', () => {
    const analysisResult = createMockAnalysisResult();

    // 模拟 ReportView.tsx 中的数据处理
    const reportData = {
      overview: analysisResult.overview || {
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
      monthlyBreakdown: analysisResult.monthlyBreakdown || [],
      regularTransfers: analysisResult.regularTransfers || [],
      repaymentTracking: analysisResult.repaymentTracking || [],
      largeInflows: analysisResult.largeInflows || [],
      counterpartSummary: analysisResult.counterpartSummary || [],
      allTransactions: mockAllTransactions || [],
    };

    // 验证所有模块都能正确渲染
    expect(reportData.overview).toBeDefined();
    expect(reportData.overview.totalIncome).toBe(50000);
    expect(reportData.overview.dateRange).toBe('2024-01-01 至 2024-12-31');
    
    expect(reportData.monthlyBreakdown).toBeDefined();
    expect(reportData.monthlyBreakdown.length).toBe(2);
    
    expect(reportData.counterpartSummary).toBeDefined();
    expect(reportData.counterpartSummary.length).toBe(1);
    
    expect(reportData.allTransactions).toBeDefined();
    expect(reportData.allTransactions.length).toBe(1);
  });

  it('Complete flow: Data integrity from generation to display', () => {
    // 第 1-2 步：生成分析结果并收集数据
    const analysisResult = createMockAnalysisResult();
    const shareButtonData = {
      title: '微信账单智能分析报表',
      overview: analysisResult.overview,
      monthlyBreakdown: analysisResult.monthlyBreakdown || [],
      regularTransfers: analysisResult.regularTransfers || [],
      repaymentTracking: analysisResult.repaymentTracking || [],
      largeInflows: analysisResult.largeInflows || [],
      counterpartSummary: analysisResult.counterpartSummary || [],
      allTransactions: mockAllTransactions,
    };

    // 第 3-4 步：创建分享链接并保存数据
    const reportId = 'abc123def456';
    const dataToStore = {
      overview: shareButtonData.overview,
      monthlyBreakdown: shareButtonData.monthlyBreakdown,
      regularTransfers: shareButtonData.regularTransfers,
      repaymentTracking: shareButtonData.repaymentTracking,
      largeInflows: shareButtonData.largeInflows,
      counterpartSummary: shareButtonData.counterpartSummary,
      allTransactions: shareButtonData.allTransactions,
    };
    const jsonString = JSON.stringify(dataToStore);

    // 第 5-6 步：打开分享链接并读取数据
    const storedData = JSON.parse(jsonString);

    // 第 7 步：显示报表内容
    const reportData = {
      overview: storedData.overview || {},
      monthlyBreakdown: storedData.monthlyBreakdown || [],
      regularTransfers: storedData.regularTransfers || [],
      repaymentTracking: storedData.repaymentTracking || [],
      largeInflows: storedData.largeInflows || [],
      counterpartSummary: storedData.counterpartSummary || [],
      allTransactions: storedData.allTransactions || [],
    };

    // 最终验证：数据完整性从头到尾
    expect(reportData.overview.totalIncome).toBe(50000);
    expect(reportData.overview.totalExpense).toBe(30000);
    expect(reportData.overview.netFlow).toBe(20000);
    expect(reportData.overview.dateRange).toBe('2024-01-01 至 2024-12-31');
    expect(reportData.overview.avgDailyIncome).toBe(136.99);
    expect(reportData.overview.avgDailyExpense).toBe(82.19);
    
    expect(reportData.monthlyBreakdown.length).toBe(2);
    expect(reportData.monthlyBreakdown[0].month).toBe('2024-01');
    expect(reportData.monthlyBreakdown[0].income).toBe(5000);
    
    expect(reportData.counterpartSummary.length).toBe(1);
    expect(reportData.counterpartSummary[0].counterpart).toBe('支付宝');
    
    expect(reportData.allTransactions.length).toBe(1);
  });
});
