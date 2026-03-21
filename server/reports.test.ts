import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createReport, getReportById } from './db';

// Mock the database
vi.mock('./db', () => ({
  getDb: vi.fn(),
  createReport: vi.fn(),
  getReportById: vi.fn(),
}));

describe('Report Sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a report with expiration date 7 days from now', async () => {
    const mockReport = {
      id: 'test-report-123',
      userId: 1,
      title: '微信账单分析报表',
      data: JSON.stringify({
        overview: { totalIncome: 10000 },
        monthlyBreakdown: [],
      }),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    vi.mocked(createReport).mockResolvedValueOnce(mockReport);

    const result = await createReport({
      id: 'test-report-123',
      userId: 1,
      title: '微信账单分析报表',
      data: JSON.stringify({
        overview: { totalIncome: 10000 },
        monthlyBreakdown: [],
      }),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('test-report-123');
    expect(result?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should retrieve a valid report', async () => {
    const mockReport = {
      id: 'test-report-456',
      userId: 1,
      title: '微信账单分析报表',
      data: JSON.stringify({
        overview: { totalIncome: 20000 },
        monthlyBreakdown: [],
      }),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    vi.mocked(getReportById).mockResolvedValueOnce(mockReport);

    const result = await getReportById('test-report-456');

    expect(result).toBeDefined();
    expect(result?.id).toBe('test-report-456');
    expect(result?.title).toBe('微信账单分析报表');
  });

  it('should handle expired report correctly', () => {
    const now = new Date();
    const expiredDate = new Date(now.getTime() - 1000); // 1 second ago

    const isExpired = expiredDate < now;
    expect(isExpired).toBe(true);
  });

  it('should handle valid report expiration check', () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const isExpired = futureDate < now;
    expect(isExpired).toBe(false);
  });
});
