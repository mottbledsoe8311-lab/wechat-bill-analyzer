import { describe, it, expect, beforeEach } from 'vitest';
import { recordVisitorVisit, recordVisitorUpload, getVisitorStats, getVisitorSummary } from './db';

describe('Visitor Stats', () => {
  beforeEach(async () => {
    // 清理测试数据（可选）
  });

  describe('recordVisitorVisit', () => {
    it('should record a visitor visit', async () => {
      const visitorId = 'test-visitor-' + Date.now();
      await recordVisitorVisit(visitorId);
      
      const stats = await getVisitorStats(1);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should increment visit count for same visitor on same day', async () => {
      const visitorId = 'test-visitor-increment-' + Date.now();
      
      // 第一次访问
      await recordVisitorVisit(visitorId);
      let stats = await getVisitorStats(1);
      const firstVisitCount = stats[stats.length - 1]?.totalVisits || 0;
      
      // 第二次访问
      await recordVisitorVisit(visitorId);
      stats = await getVisitorStats(1);
      const secondVisitCount = stats[stats.length - 1]?.totalVisits || 0;
      
      expect(secondVisitCount).toBeGreaterThan(firstVisitCount);
    });
  });

  describe('recordVisitorUpload', () => {
    it('should record a visitor upload', async () => {
      const visitorId = 'test-uploader-' + Date.now();
      await recordVisitorUpload(visitorId);
      
      const stats = await getVisitorStats(1);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should increment upload count for same visitor on same day', async () => {
      const visitorId = 'test-uploader-increment-' + Date.now();
      
      // 第一次上传
      await recordVisitorUpload(visitorId);
      let stats = await getVisitorStats(1);
      const firstUploadCount = stats[stats.length - 1]?.totalUploads || 0;
      
      // 第二次上传
      await recordVisitorUpload(visitorId);
      stats = await getVisitorStats(1);
      const secondUploadCount = stats[stats.length - 1]?.totalUploads || 0;
      
      expect(secondUploadCount).toBeGreaterThan(firstUploadCount);
    });
  });

  describe('getVisitorStats', () => {
    it('should return visitor stats for specified days', async () => {
      const visitorId = 'test-stats-' + Date.now();
      
      // 记录访问
      await recordVisitorVisit(visitorId);
      
      const stats7 = await getVisitorStats(7);
      const stats14 = await getVisitorStats(14);
      
      expect(Array.isArray(stats7)).toBe(true);
      expect(Array.isArray(stats14)).toBe(true);
      expect(stats14.length).toBeGreaterThanOrEqual(stats7.length);
    });

    it('should have correct data structure', async () => {
      const visitorId = 'test-structure-' + Date.now();
      await recordVisitorVisit(visitorId);
      
      const stats = await getVisitorStats(1);
      if (stats.length > 0) {
        const stat = stats[0];
        expect(stat).toHaveProperty('date');
        expect(stat).toHaveProperty('uniqueVisitors');
        expect(stat).toHaveProperty('totalVisits');
        expect(stat).toHaveProperty('totalUploads');
        
        expect(typeof stat.date).toBe('string');
        expect(typeof stat.uniqueVisitors).toBe('number');
        expect(typeof stat.totalVisits).toBe('number');
        expect(typeof stat.totalUploads).toBe('number');
      }
    });
  });

  describe('getVisitorSummary', () => {
    it('should return visitor summary for specified days', async () => {
      const visitorId = 'test-summary-' + Date.now();
      
      // 记录访问和上传
      await recordVisitorVisit(visitorId);
      await recordVisitorUpload(visitorId);
      
      const summary = await getVisitorSummary(7);
      
      expect(summary).toHaveProperty('totalUniqueVisitors');
      expect(summary).toHaveProperty('totalVisits');
      expect(summary).toHaveProperty('totalUploads');
      
      expect(typeof summary.totalUniqueVisitors).toBe('number');
      expect(typeof summary.totalVisits).toBe('number');
      expect(typeof summary.totalUploads).toBe('number');
    });

    it('should count unique visitors correctly', async () => {
      const visitor1 = 'test-unique-1-' + Date.now();
      const visitor2 = 'test-unique-2-' + Date.now();
      
      // 记录两个不同访客的访问
      await recordVisitorVisit(visitor1);
      await recordVisitorVisit(visitor2);
      
      const summary = await getVisitorSummary(1);
      
      expect(summary.totalUniqueVisitors).toBeGreaterThanOrEqual(2);
    });

    it('should handle multiple visits from same visitor', async () => {
      const visitorId = 'test-multiple-' + Date.now();
      
      // 同一访客多次访问
      await recordVisitorVisit(visitorId);
      await recordVisitorVisit(visitorId);
      await recordVisitorVisit(visitorId);
      
      const summary = await getVisitorSummary(1);
      
      expect(summary.totalVisits).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Mixed operations', () => {
    it('should correctly track both visits and uploads', async () => {
      const visitorId = 'test-mixed-' + Date.now();
      
      // 记录访问
      await recordVisitorVisit(visitorId);
      await recordVisitorVisit(visitorId);
      
      // 记录上传
      await recordVisitorUpload(visitorId);
      
      const stats = await getVisitorStats(1);
      const summary = await getVisitorSummary(1);
      
      if (stats.length > 0) {
        const latestStat = stats[stats.length - 1];
        expect(latestStat.totalVisits).toBeGreaterThanOrEqual(2);
        expect(latestStat.totalUploads).toBeGreaterThanOrEqual(1);
      }
      
      expect(summary.totalVisits).toBeGreaterThanOrEqual(2);
      expect(summary.totalUploads).toBeGreaterThanOrEqual(1);
    });
  });
});
