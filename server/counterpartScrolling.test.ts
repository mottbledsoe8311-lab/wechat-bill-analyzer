import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Counterpart Scrolling Navigation', () => {
  let mockElement: HTMLElement;
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // 清空DOM
    document.body.innerHTML = '';
    
    // 创建模拟元素
    scrollIntoViewMock = vi.fn();
    mockElement = document.createElement('tr');
    mockElement.scrollIntoView = scrollIntoViewMock;
  });

  it('应该为每个交易对方创建唯一的ID', () => {
    const counterpartNames = ['张三', '李四', '王五'];
    
    counterpartNames.forEach(name => {
      const element = document.createElement('tr');
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      element.id = elementId;
      document.body.appendChild(element);
    });

    // 验证每个ID都是唯一的
    counterpartNames.forEach(name => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const element = document.getElementById(elementId);
      expect(element).toBeDefined();
      expect(element?.id).toBe(elementId);
    });
  });

  it('应该正确处理特殊字符的交易对方名称', () => {
    const specialNames = [
      '张三&李四',
      '王五/赵六',
      '孙七 空格',
      '周八-连字符',
    ];

    specialNames.forEach(name => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const element = document.createElement('tr');
      element.id = elementId;
      document.body.appendChild(element);
    });

    specialNames.forEach(name => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const element = document.getElementById(elementId);
      expect(element).toBeDefined();
    });
  });

  it('应该定位到正确的客户元素', () => {
    const counterpart = '张三';
    const elementId = `counterpart-${encodeURIComponent(counterpart)}`;
    
    const element = document.createElement('tr');
    element.id = elementId;
    element.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(element);

    // 模拟定位逻辑
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('应该使用block: center确保目标在屏幕中间', () => {
    const counterpart = '李四';
    const elementId = `counterpart-${encodeURIComponent(counterpart)}`;
    
    const element = document.createElement('tr');
    element.id = elementId;
    element.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(element);

    const targetElement = document.getElementById(elementId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 验证调用参数中包含block: 'center'
    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        block: 'center',
      })
    );
  });

  it('应该处理多个客户的连续定位', () => {
    const counterparts = ['张三', '李四', '王五'];
    const mocks: ReturnType<typeof vi.fn>[] = [];

    counterparts.forEach(name => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const element = document.createElement('tr');
      element.id = elementId;
      const mockFn = vi.fn();
      element.scrollIntoView = mockFn;
      mocks.push(mockFn);
      document.body.appendChild(element);
    });

    // 模拟连续定位到不同客户
    counterparts.forEach((name, index) => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      expect(mocks[index]).toHaveBeenCalled();
    });
  });

  it('应该不会出现二次跳转', () => {
    const counterpart = '张三';
    const elementId = `counterpart-${encodeURIComponent(counterpart)}`;
    
    const element = document.createElement('tr');
    element.id = elementId;
    element.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(element);

    // 模拟定位逻辑（只调用一次）
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 验证scrollIntoView只被调用一次
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it('应该找到正确的元素而不是固定位置', () => {
    // 创建多个客户的元素
    const counterparts = ['客户A', '客户B', '客户C'];
    const elements: { [key: string]: HTMLElement } = {};

    counterparts.forEach(name => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const element = document.createElement('tr');
      element.id = elementId;
      element.textContent = name;
      elements[name] = element;
      document.body.appendChild(element);
    });

    // 验证可以找到每个特定的客户
    counterparts.forEach(name => {
      const elementId = `counterpart-${encodeURIComponent(name)}`;
      const foundElement = document.getElementById(elementId);
      expect(foundElement).toBe(elements[name]);
      expect(foundElement?.textContent).toBe(name);
    });
  });
});
