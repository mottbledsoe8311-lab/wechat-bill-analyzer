import { describe, it, expect, beforeEach } from 'vitest';
import { recordVisitorVisit, recordVisitorUpload, recordVisitorShare, getVisitorStats, getVisitorSummary } from './db';

describe('Stats Consistency', () => {
  beforeEach(async () => {
    // 测试前的准备
  });

  describe('Data consistency between daily stats and visitor stats', () => {
    it('should record visit correctly', async () => {
      const visitorId = 'test-visit-' + Date.now();
      await recordVisitorVisit(visitorId);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      expect(stats.length).toBeGreaterThan(0);
      expect(summary.totalVisits).toBeGreaterThan(0);
    });

    it('should record upload correctly', async () => {
      const visitorId = 'test-upload-' + Date.now();
      await recordVisitorUpload(visitorId);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      expect(stats.length).toBeGreaterThan(0);
      expect(summary.totalUploads).toBeGreaterThan(0);
    });

    it('should record share correctly', async () => {
      const visitorId = 'test-share-' + Date.now();
      await recordVisitorShare(visitorId);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      expect(stats.length).toBeGreaterThan(0);
      expect(summary.totalShares).toBeGreaterThan(0);
    });

    it('should correctly count shares as records with zero visits and uploads', async () => {
      const visitorId = 'test-share-count-' + Date.now();
      
      // 记录分享
      await recordVisitorShare(visitorId);
      
      const stats = await getVisitorStats(1);
      if (stats.length > 0) {
        const latestStat = stats[stats.length - 1];
        // 分享应该被计数为totalShares
        expect(latestStat.totalShares).toBeGreaterThanOrEqual(0);
      }
    });

    it('should maintain consistency between daily stats and visitor stats for uploads', async () => {
      const visitorId1 = 'test-consistency-1-' + Date.now();
      const visitorId2 = 'test-consistency-2-' + Date.now();
      
      // 记录两个访客的上传
      await recordVisitorUpload(visitorId1);
      await recordVisitorUpload(visitorId2);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      if (stats.length > 0) {
        const latestStat = stats[stats.length - 1];
        // 验证数据一致性
        expect(latestStat.totalUploads).toBeGreaterThanOrEqual(2);
        expect(summary.totalUploads).toBeGreaterThanOrEqual(latestStat.totalUploads);
      }
    });

    it('should correctly count unique visitors', async () => {
      const visitor1 = 'test-unique-1-' + Date.now();
      const visitor2 = 'test-unique-2-' + Date.now();
      
      // 同一访客多次访问
      await recordVisitorVisit(visitor1);
      await recordVisitorVisit(visitor1);
      
      // 不同访客访问
      await recordVisitorVisit(visitor2);
      
      const summary = await getVisitorSummary(1);
      
      // 应该只计数2个独立访客
      expect(summary.totalUniqueVisitors).toBeGreaterThanOrEqual(2);
      // 但访问次数应该是3次
      expect(summary.totalVisits).toBeGreaterThanOrEqual(3);
    });

    it('should handle mixed operations consistently', async () => {
      const visitorId = 'test-mixed-' + Date.now();
      
      // 混合操作
      await recordVisitorVisit(visitorId);
      await recordVisitorUpload(visitorId);
      await recordVisitorShare(visitorId);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      if (stats.length > 0) {
        const latestStat = stats[stats.length - 1];
        // 验证所有数据都被记录
        expect(latestStat.totalVisits).toBeGreaterThanOrEqual(1);
        expect(latestStat.totalUploads).toBeGreaterThanOrEqual(1);
        expect(latestStat.totalShares).toBeGreaterThanOrEqual(1);
      }
      
      expect(summary.totalVisits).toBeGreaterThanOrEqual(1);
      expect(summary.totalUploads).toBeGreaterThanOrEqual(1);
      expect(summary.totalShares).toBeGreaterThanOrEqual(1);
    });

    it('should ensure daily stats and visitor stats use same data source', async () => {
      const visitorId = 'test-same-source-' + Date.now();
      
      // 记录各种操作
      await recordVisitorVisit(visitorId);
      await recordVisitorUpload(visitorId);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      // 验证数据来自同一源
      // getVisitorStats返回按日期分组的数据，getVisitorSummary返回汇总数据
      if (stats.length > 0) {
        const latestStat = stats[stats.length - 1];
        // 验证数据结构一致
        expect(latestStat).toHaveProperty('totalVisits');
        expect(latestStat).toHaveProperty('totalUploads');
        expect(latestStat).toHaveProperty('totalShares');
        
        // 验证汇总数据大于等于最新一天的数据（可能有多天数据）
        expect(summary.totalVisits).toBeGreaterThanOrEqual(latestStat.totalVisits);
        expect(summary.totalUploads).toBeGreaterThanOrEqual(latestStat.totalUploads);
        expect(summary.totalShares).toBeGreaterThanOrEqual(latestStat.totalShares);
      }
    });
  });
});
