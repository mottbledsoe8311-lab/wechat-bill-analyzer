import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getOrCreateVisitorId, clearVisitorId } from './visitorId';

describe('Visitor ID Management', () => {
  beforeEach(() => {
    // 清除localStorage中的访客ID
    clearVisitorId();
  });

  afterEach(() => {
    // 清理测试数据
    clearVisitorId();
  });

  describe('getOrCreateVisitorId', () => {
    it('should generate a visitor ID if none exists', () => {
      const visitorId = getOrCreateVisitorId();
      expect(visitorId).toBeDefined();
      expect(typeof visitorId).toBe('string');
      expect(visitorId.length).toBeGreaterThan(0);
    });

    it('should return the same ID on subsequent calls', () => {
      const firstId = getOrCreateVisitorId();
      const secondId = getOrCreateVisitorId();
      expect(firstId).toBe(secondId);
    });

    it('should generate unique IDs for different calls after clearing', () => {
      const firstId = getOrCreateVisitorId();
      clearVisitorId();
      const secondId = getOrCreateVisitorId();
      expect(firstId).not.toBe(secondId);
    });

    it('should have the correct format (timestamp-random)', () => {
      const visitorId = getOrCreateVisitorId();
      expect(visitorId).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });

    it('should handle localStorage unavailability gracefully', () => {
      // 模拟localStorage不可用
      const originalLocalStorage = global.localStorage;
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('localStorage not available');
          },
          setItem: () => {
            throw new Error('localStorage not available');
          },
          removeItem: () => {
            throw new Error('localStorage not available');
          },
        },
        writable: true,
      });

      try {
        const visitorId = getOrCreateVisitorId();
        expect(visitorId).toBeDefined();
        expect(typeof visitorId).toBe('string');
      } finally {
        // 恢复localStorage
        Object.defineProperty(global, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
        });
      }
    });
  });

  describe('clearVisitorId', () => {
    it('should clear the stored visitor ID', () => {
      const firstId = getOrCreateVisitorId();
      clearVisitorId();
      const secondId = getOrCreateVisitorId();
      expect(firstId).not.toBe(secondId);
    });

    it('should handle clearing when no ID exists', () => {
      // 应该不抛出错误
      expect(() => clearVisitorId()).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalLocalStorage = global.localStorage;
      Object.defineProperty(global, 'localStorage', {
        value: {
          removeItem: () => {
            throw new Error('localStorage not available');
          },
        },
        writable: true,
      });

      try {
        // 应该不抛出错误
        expect(() => clearVisitorId()).not.toThrow();
      } finally {
        Object.defineProperty(global, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
        });
      }
    });
  });

  describe('Persistence', () => {
    it('should persist visitor ID across multiple calls', () => {
      const id1 = getOrCreateVisitorId();
      const id2 = getOrCreateVisitorId();
      const id3 = getOrCreateVisitorId();
      
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });
  });
});
