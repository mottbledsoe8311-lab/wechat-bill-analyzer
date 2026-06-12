/**
 * 银行卡支出统计
 * 设计：按银行卡分类统计支出，支持展开详细明细
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate } from '@/lib/analyzer';
import type { Transaction } from '@/lib/pdfParser';
import { ChevronDown, CreditCard, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  transactions: Transaction[];
}

interface BankCardSummary {
  bankCard: string;
  totalAmount: number;
  transactionCount: number;
  transactions: Transaction[];
}

const DISPLAY_LIMIT = 50;

export default function BankCardExpenseSummary({ transactions }: Props) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showAllByCard, setShowAllByCard] = useState<Set<string>>(new Set());

  // 按银行卡分类统计
  const bankCardSummaries = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    for (const tx of transactions) {
      if (tx.direction !== '支出') continue;

      // 检查是否是银行卡支付
      const method = tx.method?.trim() || '';
      const cleanMethod = method.replace(/\s+/g, '').replace(/[()（）0-9]/g, '');
      
      const isBankCard = 
        cleanMethod.includes('银行卡') || 
        cleanMethod.includes('储蓄卡') || 
        cleanMethod.includes('信用卡');

      if (!isBankCard) continue;

      // 使用原始method作为key（保留银行名称等信息）
      const key = method || '未知银行卡';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    }

    // 转换为数组并排序
    const summaries: BankCardSummary[] = Object.entries(groups)
      .map(([bankCard, txs]) => ({
        bankCard,
        totalAmount: txs.reduce((sum, tx) => sum + tx.amount, 0),
        transactionCount: txs.length,
        transactions: txs.sort((a, b) => b.date.getTime() - a.date.getTime()),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return summaries;
  }, [transactions]);

  const toggleExpanded = (bankCard: string) => {
    const newSet = new Set(expandedCards);
    if (newSet.has(bankCard)) {
      newSet.delete(bankCard);
    } else {
      newSet.add(bankCard);
    }
    setExpandedCards(newSet);
  };

  const toggleShowAll = (bankCard: string) => {
    const newSet = new Set(showAllByCard);
    if (newSet.has(bankCard)) {
      newSet.delete(bankCard);
    } else {
      newSet.add(bankCard);
    }
    setShowAllByCard(newSet);
  };

  if (bankCardSummaries.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Bank Card Expenses</p>
          <h3 className="text-2xl font-bold text-foreground">银行卡支出统计</h3>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">暂无银行卡支出记录</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="py-10 border-t border-border"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Bank Card Expenses</p>
        <h3 className="text-2xl font-bold text-foreground">银行卡支出统计</h3>
        <p className="text-sm text-muted-foreground mt-1">
          检测到 <span className="font-semibold text-foreground">{bankCardSummaries.length}</span> 张银行卡，
          共 <span className="font-semibold text-foreground">{bankCardSummaries.reduce((sum, s) => sum + s.transactionCount, 0)}</span> 笔支出
        </p>
      </div>

      {/* 银行卡列表 */}
      <div className="space-y-3">
        {bankCardSummaries.map((summary, idx) => {
          const isExpanded = expandedCards.has(summary.bankCard);
          const showAll = showAllByCard.has(summary.bankCard);
          const displayTransactions = showAll 
            ? summary.transactions 
            : summary.transactions.slice(0, DISPLAY_LIMIT);
          const hasMore = summary.transactions.length > DISPLAY_LIMIT;

          return (
            <motion.div
              key={summary.bankCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-indigo/50 transition-colors"
            >
              {/* 银行卡摘要 */}
              <button
                onClick={() => toggleExpanded(summary.bankCard)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <CreditCard className="w-5 h-5 text-indigo" />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{summary.bankCard}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {summary.transactionCount} 笔支出
                    </div>
                  </div>
                </div>
                <div className="text-right mr-3">
                  <div className="text-lg font-bold text-red-600">
                    -{formatCurrency(summary.totalAmount)}
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 详细明细 */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border/50 bg-muted/30 p-4"
                >
                  <div className="space-y-2">
                    {displayTransactions.map((tx, txIdx) => (
                      <div
                        key={txIdx}
                        className="flex items-center justify-between text-xs py-2 px-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-muted-foreground min-w-[100px]">
                            {formatDate(tx.date)}
                          </span>
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {tx.counterpart}
                          </span>
                        </div>
                        <span className="font-medium text-red-600 ml-2">
                          -{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 查看全部按钮 */}
                  {hasMore && (
                    <button
                      onClick={() => toggleShowAll(summary.bankCard)}
                      className="w-full mt-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded transition-colors"
                    >
                      {showAll 
                        ? `收起 (共${summary.transactions.length}条)` 
                        : `查看全部 (共${summary.transactions.length}条)`}
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
