import { describe, it, expect } from 'vitest';
import type { Transaction } from '@/lib/pdfParser';

// 模拟的测试数据
const mockTransactions: Transaction[] = [
  {
    date: new Date('2026-03-01'),
    dateStr: '2026-03-01',
    amount: 500,
    direction: '支出',
    counterpart: '超市购物',
    method: '工商银行储蓄卡(5694)',
    orderId: 'order1'
  },
  {
    date: new Date('2026-03-02'),
    dateStr: '2026-03-02',
    amount: 1200,
    direction: '支出',
    counterpart: '餐厅消费',
    method: '华夏银行信用卡(5233)',
    orderId: 'order2'
  },
  {
    date: new Date('2026-03-03'),
    dateStr: '2026-03-03',
    amount: 800,
    direction: '支出',
    counterpart: '加油站',
    method: '农业银行储蓄卡(1234)',
    orderId: 'order3'
  },
  {
    date: new Date('2026-03-04'),
    dateStr: '2026-03-04',
    amount: 2000,
    direction: '支出',
    counterpart: '在线购物',
    method: '工商银行储蓄卡(5694)',
    orderId: 'order4'
  },
  // 非银行卡支出（应该被过滤）
  {
    date: new Date('2026-03-05'),
    dateStr: '2026-03-05',
    amount: 100,
    direction: '支出',
    counterpart: '转账给朋友',
    method: '零钱',
    orderId: 'order5'
  },
  // 收入交易（应该被过滤）
  {
    date: new Date('2026-03-06'),
    dateStr: '2026-03-06',
    amount: 5000,
    direction: '收入',
    counterpart: '工资',
    method: '银行卡',
    orderId: 'order6'
  }
];

describe('BankCardExpenseSummary Logic', () => {
  it('应该正确识别银行卡支出交易', () => {
    // 筛选银行卡支出
    const bankCardExpenses = mockTransactions.filter(tx => {
      if (tx.direction !== '支出') return false;
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      return cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
    });

    expect(bankCardExpenses).toHaveLength(4);
    expect(bankCardExpenses.map(t => t.orderId)).toEqual(['order1', 'order2', 'order3', 'order4']);
  });

  it('应该按银行卡分类', () => {
    const groups: Record<string, Transaction[]> = {};
    
    for (const tx of mockTransactions) {
      if (tx.direction !== '支出') continue;
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
      if (!isBankCard) continue;

      const key = method || '未知银行卡';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    }

    expect(Object.keys(groups)).toHaveLength(3);
    expect(groups['工商银行储蓄卡(5694)']).toHaveLength(2);
    expect(groups['华夏银行信用卡(5233)']).toHaveLength(1);
    expect(groups['农业银行储蓄卡(1234)']).toHaveLength(1);
  });

  it('应该正确计算每张银行卡的总支出', () => {
    const groups: Record<string, Transaction[]> = {};
    
    for (const tx of mockTransactions) {
      if (tx.direction !== '支出') continue;
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
      if (!isBankCard) continue;

      const key = method || '未知银行卡';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    }

    const totalByCard = Object.entries(groups).map(([card, txs]) => ({
      card,
      total: txs.reduce((sum, tx) => sum + tx.amount, 0)
    }));

    expect(totalByCard.find(t => t.card === '工商银行储蓄卡(5694)')?.total).toBe(2500); // 500 + 2000
    expect(totalByCard.find(t => t.card === '华夏银行信用卡(5233)')?.total).toBe(1200);
    expect(totalByCard.find(t => t.card === '农业银行储蓄卡(1234)')?.total).toBe(800);
  });

  it('应该按支出金额排序银行卡', () => {
    const groups: Record<string, Transaction[]> = {};
    
    for (const tx of mockTransactions) {
      if (tx.direction !== '支出') continue;
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
      if (!isBankCard) continue;

      const key = method || '未知银行卡';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    }

    const summaries = Object.entries(groups)
      .map(([bankCard, txs]) => ({
        bankCard,
        totalAmount: txs.reduce((sum, tx) => sum + tx.amount, 0),
        transactionCount: txs.length
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    expect(summaries[0].bankCard).toBe('工商银行储蓄卡(5694)');
    expect(summaries[1].bankCard).toBe('华夏银行信用卡(5233)');
    expect(summaries[2].bankCard).toBe('农业银行储蓄卡(1234)');
  });

  it('应该过滤掉非银行卡支付方式', () => {
    const bankCardExpenses = mockTransactions.filter(tx => {
      if (tx.direction !== '支出') return false;
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      return cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
    });

    // 零钱支付应该被过滤
    expect(bankCardExpenses.find(t => t.method === '零钱')).toBeUndefined();
  });

  it('应该过滤掉收入交易', () => {
    const bankCardExpenses = mockTransactions.filter(tx => {
      if (tx.direction !== '支出') return false;
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      return cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');
    });

    // 收入交易应该被过滤
    expect(bankCardExpenses.find(t => t.direction === '收入')).toBeUndefined();
  });

  it('应该处理多行method字段', () => {
    const multilineTransaction: Transaction = {
      date: new Date('2026-03-07'),
      dateStr: '2026-03-07',
      amount: 300,
      direction: '支出',
      counterpart: '购物',
      method: '中信银行信\n用卡(3933)',
      orderId: 'order7'
    };

    const method = multilineTransaction.method?.trim() || '';
    const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
    const isBankCard = cleanMethod.includes('银行卡') || cleanMethod.includes('储蓄卡') || cleanMethod.includes('信用卡');

    expect(isBankCard).toBe(true);
  });
});
