/**
 * 银行卡大额支出扫描
 * 显示大额充值/支出交易，支持时间筛选
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate, type LargeExpense } from '@/lib/analyzer';
import { TrendingDown } from 'lucide-react';

interface Props {
  expenses: LargeExpense[];
}

type TimeRange = '1m' | '3m' | '6m' | 'all';

export default function LargeExpenseScanning({ expenses }: Props) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('all');

  // 计算时间范围
  const getDateThreshold = (range: TimeRange): Date | null => {
    const now = new Date();
    switch (range) {
      case '1m':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case '3m':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case '6m':
        return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      case 'all':
        return null;
    }
  };

  // 按时间范围筛选
  const filteredExpenses = useMemo(() => {
    const threshold = getDateThreshold(selectedRange);
    if (!threshold) return expenses;
    
    return expenses.filter(exp => exp.transaction.date >= threshold);
  }, [expenses, selectedRange]);

  // 按金额从大到小排序
  const sorted = [...filteredExpenses].sort((a, b) => b.transaction.amount - a.transaction.amount);

  if (expenses.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Large Expenses</p>
          <h3 className="text-2xl font-bold text-foreground">银行卡大额支出扫描</h3>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">未检测到大额支出交易</p>
          <p className="text-xs mt-1 opacity-60">大额支出是指超过平均支出金额的交易</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="py-10 border-t border-border"
    >
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Large Expenses</p>
        <h3 className="text-2xl font-bold text-foreground">银行卡大额支出扫描</h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          检测到 <span className="font-semibold text-foreground">{sorted.length}</span> 笔大额支出交易
        </p>
      </div>

      {/* 时间筛选 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: '1m' as TimeRange, label: '1个月' },
          { value: '3m' as TimeRange, label: '3个月' },
          { value: '6m' as TimeRange, label: '6个月' },
          { value: 'all' as TimeRange, label: '全部' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setSelectedRange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedRange === option.value
                ? 'bg-indigo text-white'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-muted-foreground">日期</th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-muted-foreground">交易对象</th>
              <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-semibold text-muted-foreground">交易银行卡</th>
              <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-muted-foreground">金额</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 20).map((expense, index) => {
              const tx = expense.transaction;
              
              return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * index }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2 px-2 sm:py-3 sm:px-4 tabular-nums text-muted-foreground">{formatDate(tx.date)}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 font-medium truncate">{tx.counterpart}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground truncate">{tx.type || '-'}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-right font-bold text-destructive">
                    -{formatCurrency(tx.amount)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > 20 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          显示前 20 条，共 {sorted.length} 条记录
        </p>
      )}
    </motion.section>
  );
}
