import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Button Click Logic - State Management Tests', () => {
  let expandedCounterpart: string | null;
  let callSequence: string[];

  beforeEach(() => {
    expandedCounterpart = null;
    callSequence = [];
  });

  /**
   * 模拟handleViewLargeInflowDetails的核心逻辑
   * 不涉及DOM操作和浏览器API
   */
  const handleViewLargeInflowDetails = (counterpart: string) => {
    if (expandedCounterpart === counterpart) {
      // 已展开该客户，先清空再重新设置
      callSequence.push(`setExpandedCounterpart(null)`);
      expandedCounterpart = null;
      
      // 模拟setTimeout的立即执行
      callSequence.push(`setExpandedCounterpart('${counterpart}')`);
      expandedCounterpart = counterpart;
    } else {
      // 首次点击或点击不同客户
      callSequence.push(`setExpandedCounterpart('${counterpart}')`);
      expandedCounterpart = counterpart;
    }
  };

  it('场景1: 第一次点击客户A', () => {
    handleViewLargeInflowDetails('客户A');
    
    expect(expandedCounterpart).toBe('客户A');
    expect(callSequence).toEqual(["setExpandedCounterpart('客户A')"]);
  });

  it('场景2: 点击A后再点击A（二次点击同一客户）', () => {
    // 第一次点击
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    
    // 第二次点击同一客户
    callSequence = [];
    handleViewLargeInflowDetails('客户A');
    
    expect(expandedCounterpart).toBe('客户A');
    expect(callSequence).toEqual([
      'setExpandedCounterpart(null)',
      "setExpandedCounterpart('客户A')"
    ]);
  });

  it('场景3: 点击A、A、A（三次连续点击同一客户）', () => {
    // 第一次
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    
    // 第二次
    callSequence = [];
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    expect(callSequence).toEqual([
      'setExpandedCounterpart(null)',
      "setExpandedCounterpart('客户A')"
    ]);
    
    // 第三次
    callSequence = [];
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    expect(callSequence).toEqual([
      'setExpandedCounterpart(null)',
      "setExpandedCounterpart('客户A')"
    ]);
  });

  it('场景4: 点击A后点击B（切换不同客户）', () => {
    // 点击A
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    
    // 点击B
    callSequence = [];
    handleViewLargeInflowDetails('客户B');
    expect(expandedCounterpart).toBe('客户B');
    expect(callSequence).toEqual(["setExpandedCounterpart('客户B')"]);
  });

  it('场景5: 点击A、B、A、B（多次切换）', () => {
    // 点击A
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    
    // 点击B
    callSequence = [];
    handleViewLargeInflowDetails('客户B');
    expect(expandedCounterpart).toBe('客户B');
    
    // 点击A
    callSequence = [];
    handleViewLargeInflowDetails('客户A');
    expect(expandedCounterpart).toBe('客户A');
    
    // 点击B
    callSequence = [];
    handleViewLargeInflowDetails('客户B');
    expect(expandedCounterpart).toBe('客户B');
  });

  it('场景6: 复杂场景 - A、A、B、B、A、A、C、C', () => {
    const sequence = ['A', 'A', 'B', 'B', 'A', 'A', 'C', 'C'];
    const expectedStates = ['A', 'A', 'B', 'B', 'A', 'A', 'C', 'C'];
    
    sequence.forEach((customer, index) => {
      handleViewLargeInflowDetails(`客户${customer}`);
      expect(expandedCounterpart).toBe(`客户${expectedStates[index]}`);
    });
  });

  it('场景7: 验证状态一致性 - 每次点击后状态都应该正确', () => {
    const customers = ['客户A', '客户B', '客户C', '客户A', '客户B'];
    
    customers.forEach((customer) => {
      handleViewLargeInflowDetails(customer);
      // 每次点击后，expandedCounterpart应该等于当前点击的客户
      expect(expandedCounterpart).toBe(customer);
    });
  });

  it('场景8: 验证多次重复点击的响应 - 应该每次都触发状态变化', () => {
    const customer = '客户A';
    
    for (let i = 0; i < 5; i++) {
      callSequence = [];
      handleViewLargeInflowDetails(customer);
      
      if (i === 0) {
        // 第一次点击
        expect(callSequence).toEqual(["setExpandedCounterpart('客户A')"]);
      } else {
        // 后续点击都应该先清空再重新设置
        expect(callSequence).toEqual([
          'setExpandedCounterpart(null)',
          "setExpandedCounterpart('客户A')"
        ]);
      }
      
      expect(expandedCounterpart).toBe(customer);
    }
  });

  it('场景9: 验证特殊字符处理', () => {
    const specialCustomer = '客户&李四/王五';
    
    // 第一次点击
    handleViewLargeInflowDetails(specialCustomer);
    expect(expandedCounterpart).toBe(specialCustomer);
    
    // 第二次点击
    callSequence = [];
    handleViewLargeInflowDetails(specialCustomer);
    expect(expandedCounterpart).toBe(specialCustomer);
    expect(callSequence).toEqual([
      'setExpandedCounterpart(null)',
      `setExpandedCounterpart('${specialCustomer}')`
    ]);
  });
});
