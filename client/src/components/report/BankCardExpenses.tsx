/**
 * 银行卡支出统计模块
 * 分类统计银行卡的支出汇总，包含时间、金额、对象
 * 支持展开查看每个银行的明细
 * 支持时间范围选择
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '@/lib/analyzer';
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subMonths, startOfDay, endOfDay } from 'date-fns';

interface BankExpense {
  bank: string;
  totalAmount: number;
  count: number;
  lastDate: Date;
  transactions: any[];
}

type TimeRange = '1m' | '3m' | '6m' | 'all';

export default function BankCardExpenses({ allTransactions }: { allTransactions?: any[] }) {
  const [expandLimit, setExpandLimit] = useState(50);
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  // 计算时间范围
  const getDateRange = (range: TimeRange) => {
    const now = new Date();
    const endDate = endOfDay(now);
    let startDate: Date;

    switch (range) {
      case '1m':
        startDate = startOfDay(subMonths(now, 1));
        break;
      case '3m':
        startDate = startOfDay(subMonths(now, 3));
        break;
      case '6m':
        startDate = startOfDay(subMonths(now, 6));
        break;
      case 'all':
        startDate = new Date('2000-01-01');
        break;
      default:
        startDate = startOfDay(subMonths(now, 3));
    }

    return { startDate, endDate };
  };

  // 获取当前时间范围
  const getCurrentDateRange = () => {
    if (showCustom && customStartDate && customEndDate) {
      return {
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate),
      };
    }
    return getDateRange(timeRange);
  };

  // 提取银行卡支出数据
  const bankExpenses = useMemo(() => {
    if (!allTransactions) return [];

    const { startDate, endDate } = getCurrentDateRange();
    const bankMap = new Map<string, BankExpense>();

    allTransactions
      .filter((tx: any) => {
        // 筛选银行卡支出交易
        const isExpense = tx.direction === '支出' || tx.direction === '支' || tx.direction?.includes('支');
        const isBankCard = tx.method === '银行卡' || tx.method?.includes('银行卡');
        
        // 筛选时间范围
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date instanceof Date ? tx.date : new Date();
        const inRange = txDate >= startDate && txDate <= endDate;
        
        return isExpense && isBankCard && inRange;
      })
      .forEach((tx: any) => {
        // 从对方名称中提取银行信息
        const counterpart = tx.counterpart || '其他';
        let bankName = '其他';

        // 常见银行关键词
        const bankKeywords: Record<string, string[]> = {
          '工商银行': ['工商', 'icbc', '工行'],
          '农业银行': ['农业', 'abc', '农行'],
          '中国银行': ['中国银行', 'boc', '中行'],
          '建设银行': ['建设', 'ccb', '建行'],
          '交通银行': ['交通', 'bankcomm'],
          '招商银行': ['招商', 'cmbchina', '招行'],
          '浦发银行': ['浦发', 'spdb'],
          '民生银行': ['民生', 'cmb'],
          '光大银行': ['光大', 'cebbank'],
          '华夏银行': ['华夏', 'huaxia'],
          '平安银行': ['平安', 'pingan'],
          '兴业银行': ['兴业', 'cib'],
          '中信银行': ['中信', 'citic'],
          '北京银行': ['北京', 'bccb'],
          '上海银行': ['上海', 'shbank'],
          '支付宝': ['支付宝', 'alipay'],
          '微信支付': ['微信', 'wechat'],
        };

        for (const [bank, keywords] of Object.entries(bankKeywords)) {
          if (keywords.some(kw => counterpart.toLowerCase().includes(kw.toLowerCase()))) {
            bankName = bank;
            break;
          }
        }

        const key = bankName;
        const existing = bankMap.get(key);

        if (existing) {
          existing.totalAmount += tx.amount;
          existing.count += 1;
          existing.transactions.push(tx);
          const existingTime = typeof existing.lastDate === 'string'
            ? new Date(existing.lastDate).getTime()
            : existing.lastDate instanceof Date
              ? existing.lastDate.getTime()
              : 0;
          const txTime = typeof tx.date === 'string'
            ? new Date(tx.date).getTime()
            : tx.date instanceof Date
              ? tx.date.getTime()
              : 0;
          existing.lastDate = new Date(Math.max(existingTime, txTime));
        } else {
          bankMap.set(key, {
            bank: bankName,
            totalAmount: tx.amount,
            count: 1,
            lastDate: tx.date,
            transactions: [tx],
          });
        }
      });

    // 按金额降序排列
    return Array.from(bankMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [allTransactions, timeRange, customStartDate, customEndDate, showCustom]);

  const toggleBank = (bank: string) => {
    const newSet = new Set(expandedBanks);
    if (newSet.has(bank)) {
      newSet.delete(bank);
    } else {
      newSet.add(bank);
    }
    setExpandedBanks(newSet);
  };

  if (!allTransactions || allTransactions.length === 0 || bankExpenses.length === 0) {
    return null;
  }

  // 计算总支出
  const totalExpense = bankExpenses.reduce((sum, bank) => sum + bank.totalAmount, 0);
  const { startDate, endDate } = getCurrentDateRange();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-2">
          Bank Card Expenses
        </p>
        <h3 className="text-2xl font-bold text-foreground">银行卡支出统计</h3>
        <p className="text-sm text-muted-foreground mt-1">
          共涉及 <span className="font-semibold text-foreground">{bankExpenses.length}</span> 个银行 · 总支出 <span className="font-semibold text-destructive">{formatCurrency(totalExpense)}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          时间范围：{format(startDate, 'yyyy-MM-dd')} 至 {format(endDate, 'yyyy-MM-dd')}
        </p>
      </div>

      {/* 时间范围选择器 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setTimeRange('1m');
            setShowCustom(false);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            timeRange === '1m' && !showCustom
              ? 'bg-indigo text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          近1月
        </button>
        <button
          onClick={() => {
            setTimeRange('3m');
            setShowCustom(false);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            timeRange === '3m' && !showCustom
              ? 'bg-indigo text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          近3月
        </button>
        <button
          onClick={() => {
            setTimeRange('6m');
            setShowCustom(false);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            timeRange === '6m' && !showCustom
              ? 'bg-indigo text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          近6月
        </button>
        <button
          onClick={() => {
            setTimeRange('all');
            setShowCustom(false);
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            timeRange === 'all' && !showCustom
              ? 'bg-indigo text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            showCustom
              ? 'bg-indigo text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          自定义
        </button>
      </div>

      {/* 自定义时间范围 */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">开始日期</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">结束日期</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 银行列表 */}
      <div className="space-y-3">
        {bankExpenses.slice(0, expandLimit).map((bank, index) => (
          <motion.div
            key={bank.bank}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-border rounded-lg p-4 hover:border-indigo/50 transition-colors"
          >
            {/* 银行卡摘要 */}
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => toggleBank(bank.bank)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo/10">
                  <CreditCard className="w-5 h-5 text-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{bank.bank}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    最近交易：{formatDate(bank.lastDate)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-semibold text-destructive">{formatCurrency(bank.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">{bank.count}笔</p>
                {expandedBanks.has(bank.bank) ? (
                  <ChevronUp className="w-4 h-4 mt-1 mx-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 mt-1 mx-auto" />
                )}
              </div>
            </div>

            {/* 展开明细 */}
            <AnimatePresence>
              {expandedBanks.has(bank.bank) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">时间</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">对象</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bank.transactions.map((tx: any, idx: number) => {
                          const txDate = typeof tx.date === 'string'
                            ? new Date(tx.date)
                            : tx.date instanceof Date
                              ? tx.date
                              : new Date();
                          return (
                            <tr key={idx} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                              <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">
                                {format(txDate, 'MM-dd HH:mm')}
                              </td>
                              <td className="py-1.5 px-2 text-foreground truncate max-w-[200px]">
                                {tx.counterpart}
                              </td>
                              <td className="py-1.5 px-2 text-right font-medium text-destructive">
                                {formatCurrency(tx.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* 查看更多按钮 */}
      {bankExpenses.length > expandLimit && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setExpandLimit(bankExpenses.length)}
            className="px-4 py-2 text-sm font-medium text-indigo bg-indigo/10 hover:bg-indigo/20 rounded-lg transition-colors"
          >
            查看全部 (当前{expandLimit}条, 共{bankExpenses.length}个)
          </button>
        </div>
      )}

      {/* 已显示全部提示 */}
      {bankExpenses.length <= expandLimit && bankExpenses.length > 50 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          已显示全部{bankExpenses.length}个银行
        </p>
      )}
    </motion.section>
  );
}
