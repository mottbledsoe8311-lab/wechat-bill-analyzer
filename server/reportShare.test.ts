import { describe, it, expect } from 'vitest';
import { createReport, getReportById } from './db';
import type { InsertReport } from './db';

describe('Report Share Functionality', () => {
  it('should create and retrieve a report', async () => {
    const testReport: InsertReport = {
      title: 'Test Report',
      data: JSON.stringify({
        overview: {
          accountName: 'Test Account',
          dateRange: '2026-01-01 to 2026-04-22',
          totalIncome: 50000,
          totalExpense: 30000,
          netIncome: 20000,
        },
        monthlyBreakdown: [],
        regularTransfers: [],
        repaymentTracking: [],
        largeInflows: [],
        counterpartSummary: [],
        allTransactions: [],
      }),
      userId: 'test-user-123',
    };

    try {
      // 创建报表
      const savedReport = await createReport(testReport);
      expect(savedReport).toBeTruthy();
      expect(savedReport?.id).toBeTruthy();
      console.log('✓ Report created successfully with ID:', savedReport?.id);

      // 获取报表
      if (savedReport?.id) {
        const retrievedReport = await getReportById(savedReport.id);
        expect(retrievedReport).toBeTruthy();
        expect(retrievedReport?.title).toBe(testReport.title);
        console.log('✓ Report retrieved successfully');

        // 验证数据完整性
        const reportData = JSON.parse(retrievedReport?.data || '{}');
        expect(reportData.overview).toBeTruthy();
        expect(reportData.overview.accountName).toBe('Test Account');
        console.log('✓ Report data integrity verified');
      }
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  it('should handle missing report gracefully', async () => {
    try {
      const report = await getReportById('nonexistent-id-12345');
      expect(report).toBeUndefined();
      console.log('✓ Missing report handled gracefully');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  it('should validate report data structure', async () => {
    const testReport: InsertReport = {
      title: 'Validation Test Report',
      data: JSON.stringify({
        overview: {
          accountName: 'Test Account',
          dateRange: '2026-01-01 to 2026-04-22',
          totalIncome: 50000,
          totalExpense: 30000,
          netIncome: 20000,
        },
        monthlyBreakdown: [],
        regularTransfers: [],
        repaymentTracking: [],
        largeInflows: [],
        counterpartSummary: [],
        allTransactions: [],
      }),
      userId: 'test-user-456',
    };

    try {
      const savedReport = await createReport(testReport);
      expect(savedReport).toBeTruthy();
      
      const reportData = JSON.parse(savedReport?.data || '{}');
      expect(reportData).toHaveProperty('overview');
      expect(reportData).toHaveProperty('monthlyBreakdown');
      expect(reportData).toHaveProperty('regularTransfers');
      expect(reportData).toHaveProperty('repaymentTracking');
      expect(reportData).toHaveProperty('largeInflows');
      expect(reportData).toHaveProperty('counterpartSummary');
      expect(reportData).toHaveProperty('allTransactions');
      
      console.log('✓ Report data structure is valid');
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});
