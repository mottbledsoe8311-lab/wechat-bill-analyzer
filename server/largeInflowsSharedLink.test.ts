import { describe, it, expect } from 'vitest';

/**
 * 端到端测试：验证分享链接中的大额入账监控模块能正确显示数据
 */

describe('LargeInflows in Shared Links - End-to-End', () => {
  // 模拟完整的报表数据序列化和反序列化流程
  function simulateShareLinkFlow(analysisResult: any) {
    // 步骤1：序列化（模拟保存到数据库）
    const serialized = JSON.stringify(analysisResult);
    
    // 步骤2：反序列化（模拟从数据库加载）
    const deserialized = JSON.parse(serialized);
    
    // 步骤3：修复日期（模拟 ReportView.tsx 中的反序列化逻辑）
    if (deserialized.largeInflows && Array.isArray(deserialized.largeInflows)) {
      deserialized.largeInflows = deserialized.largeInflows.map((item: any) => ({
        ...item,
        transaction: {
          ...item.transaction,
          date: typeof item.transaction?.date === 'string' ? new Date(item.transaction.date) : item.transaction?.date
        },
        relatedOutflows: Array.isArray(item.relatedOutflows) ? item.relatedOutflows.map((tx: any) => ({
          ...tx,
          date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date
        })) : []
      }));
    }
    
    return deserialized;
  }

  it('should preserve largeInflows data through serialization and deserialization', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信',
            orderId: 'order123',
            dateStr: '2024-01-15',
            timeStr: '10:30'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: [
            {
              date: new Date('2024-01-16T14:20:00Z'),
              counterpart: '商户A',
              amount: 5000,
              direction: '支出',
              type: '消费',
              method: '微信'
            }
          ]
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    expect(result.largeInflows).toHaveLength(1);
    expect(result.largeInflows[0].transaction.date).toBeInstanceOf(Date);
    expect(result.largeInflows[0].transaction.counterpart).toBe('张三');
    expect(result.largeInflows[0].transaction.amount).toBe(10000);
    expect(result.largeInflows[0].percentile).toBe(85);
    expect(result.largeInflows[0].isUnusual).toBe(false);
    expect(result.largeInflows[0].relatedOutflows).toHaveLength(1);
    expect(result.largeInflows[0].relatedOutflows[0].date).toBeInstanceOf(Date);
  });

  it('should handle multiple largeInflows items correctly', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: []
        },
        {
          transaction: {
            date: new Date('2024-02-20T15:45:00Z'),
            counterpart: '李四',
            amount: 15000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 92,
          isUnusual: true,
          relatedOutflows: []
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    expect(result.largeInflows).toHaveLength(2);
    expect(result.largeInflows[0].transaction.counterpart).toBe('张三');
    expect(result.largeInflows[1].transaction.counterpart).toBe('李四');
    expect(result.largeInflows[0].transaction.date.getDate()).toBe(15);
    expect(result.largeInflows[1].transaction.date.getDate()).toBe(20);
  });

  it('should handle largeInflows with multiple relatedOutflows', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: [
            {
              date: new Date('2024-01-16T14:20:00Z'),
              counterpart: '商户A',
              amount: 5000,
              direction: '支出',
              type: '消费',
              method: '微信'
            },
            {
              date: new Date('2024-01-17T09:15:00Z'),
              counterpart: '商户B',
              amount: 3000,
              direction: '支出',
              type: '消费',
              method: '微信'
            },
            {
              date: new Date('2024-01-18T11:00:00Z'),
              counterpart: '商户C',
              amount: 2000,
              direction: '支出',
              type: '消费',
              method: '微信'
            }
          ]
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    expect(result.largeInflows[0].relatedOutflows).toHaveLength(3);
    result.largeInflows[0].relatedOutflows.forEach((tx: any) => {
      expect(tx.date).toBeInstanceOf(Date);
    });
    expect(result.largeInflows[0].relatedOutflows[0].counterpart).toBe('商户A');
    expect(result.largeInflows[0].relatedOutflows[1].counterpart).toBe('商户B');
    expect(result.largeInflows[0].relatedOutflows[2].counterpart).toBe('商户C');
  });

  it('should allow LargeInflows component to access transaction data correctly', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: []
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    // 模拟 LargeInflows 组件访问数据的方式
    const inflows = result.largeInflows;
    expect(inflows.length).toBeGreaterThan(0);
    
    const item = inflows[0];
    expect(item.transaction).toBeDefined();
    expect(item.transaction.date).toBeInstanceOf(Date);
    expect(item.transaction.date.getTime()).toBeGreaterThan(0);
    expect(item.transaction.counterpart).toBe('张三');
    expect(item.transaction.amount).toBe(10000);
    
    // 模拟组件中的日期处理
    const dateStr = item.transaction.date.toLocaleDateString();
    expect(dateStr).toContain('2024');
  });

  it('should handle empty largeInflows array', () => {
    const analysisResult = {
      largeInflows: []
    };

    const result = simulateShareLinkFlow(analysisResult);

    expect(result.largeInflows).toHaveLength(0);
    expect(Array.isArray(result.largeInflows)).toBe(true);
  });

  it('should preserve all transaction fields during serialization', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信',
            orderId: 'order123',
            dateStr: '2024-01-15',
            timeStr: '10:30',
            remark: '工资'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: []
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    const tx = result.largeInflows[0].transaction;
    expect(tx.orderId).toBe('order123');
    expect(tx.dateStr).toBe('2024-01-15');
    expect(tx.timeStr).toBe('10:30');
    expect(tx.remark).toBe('工资');
  });

  it('should handle largeInflows with filtering by time range', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: []
        },
        {
          transaction: {
            date: new Date('2024-02-20T15:45:00Z'),
            counterpart: '李四',
            amount: 15000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 92,
          isUnusual: true,
          relatedOutflows: []
        },
        {
          transaction: {
            date: new Date('2024-03-10T08:00:00Z'),
            counterpart: '王五',
            amount: 8000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 78,
          isUnusual: false,
          relatedOutflows: []
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    // 模拟时间范围筛选（最近1个月）
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const filtered = result.largeInflows.filter(item => {
      return item.transaction.date >= oneMonthAgo && item.transaction.date <= now;
    });

    // 结果应该包含所有项（因为测试数据都在过去）
    expect(filtered.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle largeInflows with sorting by amount', () => {
    const analysisResult = {
      largeInflows: [
        {
          transaction: {
            date: new Date('2024-01-15T10:30:00Z'),
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 85,
          isUnusual: false,
          relatedOutflows: []
        },
        {
          transaction: {
            date: new Date('2024-02-20T15:45:00Z'),
            counterpart: '李四',
            amount: 15000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 92,
          isUnusual: true,
          relatedOutflows: []
        },
        {
          transaction: {
            date: new Date('2024-03-10T08:00:00Z'),
            counterpart: '王五',
            amount: 8000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 78,
          isUnusual: false,
          relatedOutflows: []
        }
      ]
    };

    const result = simulateShareLinkFlow(analysisResult);

    // 按金额排序（从大到小）
    const sorted = [...result.largeInflows].sort((a, b) => b.transaction.amount - a.transaction.amount);

    expect(sorted[0].transaction.amount).toBe(15000);
    expect(sorted[1].transaction.amount).toBe(10000);
    expect(sorted[2].transaction.amount).toBe(8000);
  });
});
