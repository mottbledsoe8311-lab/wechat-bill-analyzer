import type { Transaction } from '@/lib/pdfParser';

export interface BankCardSummary {
  bankCard: string;
  totalAmount: number;
  transactionCount: number;
  transactions: Transaction[];
}

/** Normalize PDF payment-method text without losing the original label used in the UI. */
export function normalizeBankCardMethod(method: unknown): string {
  return String(method ?? '')
    .replace(/\s+/g, '')
    .replace(/[()（）0-9]/g, '');
}

export function isBankCardExpense(transaction: Transaction): boolean {
  if (transaction.direction !== '支出') return false;
  const method = normalizeBankCardMethod(transaction.method);
  return method.includes('银行卡') || method.includes('储蓄卡') || method.includes('信用卡');
}

export function summarizeBankCardExpenses(transactions: Transaction[]): BankCardSummary[] {
  const groups: Record<string, Transaction[]> = {};

  for (const transaction of transactions) {
    if (!isBankCardExpense(transaction)) continue;
    const key = (String(transaction.method ?? '').replace(/\s+/g, '').trim() || '未知银行卡')
      .replace(/[\-—–]+$/, '');
    (groups[key] ??= []).push(transaction);
  }

  return Object.entries(groups)
    .map(([bankCard, groupedTransactions]) => ({
      bankCard,
      totalAmount: groupedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      transactionCount: groupedTransactions.length,
      transactions: [...groupedTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}
