import { describe, it, expect } from 'vitest';

/**
 * 测试 largeInflows 数据反序列化
 * 验证分享链接中的 largeInflows 数据能正确处理嵌套的日期对象
 */

describe('LargeInflows Deserialization', () => {
  // 模拟 ReportView 中的反序列化逻辑
  function deserializeLargeInflows(data: any) {
    if (data.largeInflows && Array.isArray(data.largeInflows)) {
      data.largeInflows = data.largeInflows.map((item: any) => ({
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
    return data;
  }

  it('should deserialize largeInflows with string dates', () => {
    const data = {
      largeInflows: [
        {
          transaction: {
            date: '2024-01-15T10:30:00Z',
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
              date: '2024-01-16T14:20:00Z',
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

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows).toHaveLength(1);
    expect(result.largeInflows[0].transaction.date).toBeInstanceOf(Date);
    expect(result.largeInflows[0].transaction.date.getFullYear()).toBe(2024);
    expect(result.largeInflows[0].transaction.date.getMonth()).toBe(0);
    expect(result.largeInflows[0].transaction.date.getDate()).toBe(15);
    expect(result.largeInflows[0].transaction.counterpart).toBe('张三');
    expect(result.largeInflows[0].transaction.amount).toBe(10000);
    expect(result.largeInflows[0].percentile).toBe(85);
    expect(result.largeInflows[0].isUnusual).toBe(false);
  });

  it('should deserialize relatedOutflows with string dates', () => {
    const data = {
      largeInflows: [
        {
          transaction: {
            date: '2024-01-15T10:30:00Z',
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
              date: '2024-01-16T14:20:00Z',
              counterpart: '商户A',
              amount: 5000,
              direction: '支出',
              type: '消费',
              method: '微信'
            },
            {
              date: '2024-01-17T09:15:00Z',
              counterpart: '商户B',
              amount: 3000,
              direction: '支出',
              type: '消费',
              method: '微信'
            }
          ]
        }
      ]
    };

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows[0].relatedOutflows).toHaveLength(2);
    expect(result.largeInflows[0].relatedOutflows[0].date).toBeInstanceOf(Date);
    expect(result.largeInflows[0].relatedOutflows[0].date.getDate()).toBe(16);
    expect(result.largeInflows[0].relatedOutflows[1].date).toBeInstanceOf(Date);
    expect(result.largeInflows[0].relatedOutflows[1].date.getDate()).toBe(17);
  });

  it('should handle Date objects that are already deserialized', () => {
    const date1 = new Date('2024-01-15T10:30:00Z');
    const date2 = new Date('2024-01-16T14:20:00Z');

    const data = {
      largeInflows: [
        {
          transaction: {
            date: date1,
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
              date: date2,
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

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows[0].transaction.date).toBeInstanceOf(Date);
    expect(result.largeInflows[0].transaction.date.getTime()).toBe(date1.getTime());
    expect(result.largeInflows[0].relatedOutflows[0].date).toBeInstanceOf(Date);
    expect(result.largeInflows[0].relatedOutflows[0].date.getTime()).toBe(date2.getTime());
  });

  it('should handle empty relatedOutflows', () => {
    const data = {
      largeInflows: [
        {
          transaction: {
            date: '2024-01-15T10:30:00Z',
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

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows[0].relatedOutflows).toHaveLength(0);
    expect(Array.isArray(result.largeInflows[0].relatedOutflows)).toBe(true);
  });

  it('should handle missing relatedOutflows field', () => {
    const data = {
      largeInflows: [
        {
          transaction: {
            date: '2024-01-15T10:30:00Z',
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信'
          },
          percentile: 85,
          isUnusual: false
        }
      ]
    };

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows[0].relatedOutflows).toHaveLength(0);
    expect(Array.isArray(result.largeInflows[0].relatedOutflows)).toBe(true);
  });

  it('should handle multiple largeInflows items', () => {
    const data = {
      largeInflows: [
        {
          transaction: {
            date: '2024-01-15T10:30:00Z',
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
            date: '2024-02-20T15:45:00Z',
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
            date: '2024-03-10T08:00:00Z',
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

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows).toHaveLength(3);
    expect(result.largeInflows[0].transaction.date.getDate()).toBe(15);
    expect(result.largeInflows[1].transaction.date.getDate()).toBe(20);
    expect(result.largeInflows[2].transaction.date.getDate()).toBe(10);
    expect(result.largeInflows[1].isUnusual).toBe(true);
  });

  it('should preserve all other fields during deserialization', () => {
    const data = {
      largeInflows: [
        {
          transaction: {
            date: '2024-01-15T10:30:00Z',
            counterpart: '张三',
            amount: 10000,
            direction: '收入',
            type: '转账',
            method: '微信',
            orderId: 'order123',
            dateStr: '2024-01-15',
            timeStr: '10:30'
          },
          percentile: 85.5,
          isUnusual: false,
          relatedOutflows: []
        }
      ]
    };

    const result = deserializeLargeInflows(data);
    
    expect(result.largeInflows[0].transaction.orderId).toBe('order123');
    expect(result.largeInflows[0].transaction.dateStr).toBe('2024-01-15');
    expect(result.largeInflows[0].transaction.timeStr).toBe('10:30');
    expect(result.largeInflows[0].percentile).toBe(85.5);
  });
});
