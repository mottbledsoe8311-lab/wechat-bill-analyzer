import { describe, expect, it } from 'vitest';
import type { Transaction } from '../client/src/lib/pdfParser';
import { isBankCardExpense, normalizeBankCardMethod, summarizeBankCardExpenses } from '../client/src/lib/bankCardExpenseSummary';

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    orderId: 'order',
    date: new Date('2026-03-08T12:00:00'),
    dateStr: '2026-03-08 12:00:00',
    type: '商户消费',
    direction: '支出',
    method: '工商银行储 蓄卡(5694)',
    amount: 100,
    counterpart: '测试商户',
    merchantId: '',
    ...overrides,
  };
}

describe('bank card expense summary', () => {
  it('normalizes PDF line-break spaces in card methods', () => {
    expect(normalizeBankCardMethod('工商银行储\n蓄卡(5694)')).toBe('工商银行储蓄卡');
    expect(normalizeBankCardMethod('中信银行信 用卡(3933)')).toBe('中信银行信用卡');
  });

  it('accepts card expenses and rejects income, other directions, and wallet payments', () => {
    expect(isBankCardExpense(transaction({ method: '工商银行储\n蓄卡(5694)' }))).toBe(true);
    expect(isBankCardExpense(transaction({ method: '华夏银行信用卡(5233)' }))).toBe(true);
    expect(isBankCardExpense(transaction({ method: '零钱' }))).toBe(false);
    expect(isBankCardExpense(transaction({ direction: '收入', method: '工商银行储蓄卡(5694)' }))).toBe(false);
    expect(isBankCardExpense(transaction({ direction: '其他', method: '工商银行储蓄卡(5694)' }))).toBe(false);
  });

  it('groups cards, totals amounts, sorts cards and details, and preserves input order', () => {
    const transactions = [
      transaction({ orderId: 'icbc-1', method: '工商银行储\n蓄卡(5694)', amount: 13, date: new Date('2026-03-07') }),
      transaction({ orderId: 'icbc-2', method: '工商银行储 蓄卡(5694)', amount: 6, date: new Date('2026-03-08') }),
      transaction({ orderId: 'cc-1', method: '华夏银行信用卡(5233)', amount: 50, date: new Date('2026-03-06') }),
      transaction({ orderId: 'wallet-1', method: '零钱', amount: 999 }),
    ];
    const originalOrder = transactions.map((item) => item.orderId);

    const summaries = summarizeBankCardExpenses(transactions);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({ bankCard: '华夏银行信用卡(5233)', totalAmount: 50, transactionCount: 1 });
    expect(summaries[1]).toMatchObject({ bankCard: '工商银行储蓄卡(5694)', totalAmount: 19, transactionCount: 2 });
    expect(summaries[1].transactions.map((item) => item.orderId)).toEqual(['icbc-2', 'icbc-1']);
    expect(summaries.flatMap((summary) => summary.transactions)).toHaveLength(3);
    expect(transactions.map((item) => item.orderId)).toEqual(originalOrder);
  });
});
