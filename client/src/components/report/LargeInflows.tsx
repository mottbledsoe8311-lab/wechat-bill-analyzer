/**
 * 大额入账监控
 * 设计：精致卡片式 - 醒目的大额标记，时间范围筛选
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate, type LargeInflow } from '@/lib/analyzer';
import { ArrowDownLeft, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  inflows: LargeInflow[];
}

type TimeRange = '1month' | '3months' | '6months' | 'all';

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: '1month',  label: '近1月' },
  { key: '3months', label: '近3月' },
  { key: '6months', label: '近6月' },
  { key: 'all',     label: '全部' },
];

export default function LargeInflows({ inflows }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3months');
  const [sortBy, setSortBy] = useState<'time' | 'amount'>('time');

  const filteredInflows = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === '1month')  start.setMonth(start.getMonth() - 1);
    else if (timeRange === '3months') start.setMonth(start.getMonth() - 3);
    else if (timeRange === '6months') start.setMonth(start.getMonth() - 6);
    else start.setFullYear(1970);

    let sorted = inflows
      .filter(item => {
        const d = item.transaction.date;
        return d >= start && d <= end;
      });
    
    if (sortBy === 'time') {
      sorted.sort((a, b) => b.transaction.date.getTime() - a.transaction.date.getTime());
    } else {
      sorted.sort((a, b) => b.transaction.amount - a.transaction.amount);
    }
    
    return sorted;
  }, [inflows, timeRange, sortBy]);

  if (inflows.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Large Inflows</p>
          <h3 className="text-2xl font-bold text-foreground">大额入账监控</h3>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">未检测到大额入账记录</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="py-10 border-t border-border"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Large Inflows</p>
        <h3 className="text-2xl font-bold text-foreground">大额入账监控</h3>
        <p className="text-sm text-muted-foreground mt-1">
          检测到 <span className="font-semibold text-foreground">{filteredInflows.length}</span> 笔大额入账
        </p>
      </div>

      {/* 时间范围选择器 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>时间范围</span>
          </div>
          {TIME_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === opt.key
                  ? 'bg-indigo text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        {/* 排序按钮 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">排序：</span>
          <button
            onClick={() => setSortBy('time')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
              sortBy === 'time'
                ? 'bg-indigo text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            按时间
          </button>
          <button
            onClick={() => setSortBy('amount')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
              sortBy === 'amount'
                ? 'bg-indigo text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            按金额
          </button>
        </div>
      </div>

      {/* 大额入账卡片列表 */}
      <div className="space-y-3">
        {filteredInflows.map((item, idx) => (
          <motion.div
            key={`${item.transaction.date.getTime()}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card border border-border rounded-lg p-4 hover:border-indigo/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">{item.transaction.counterpart}</span>
                  {item.isUnusual && (
                    <Badge variant="destructive" className="text-xs">异常</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(item.transaction.date)}</span>
                  <span>•</span>
                  <span>百分位：{Math.round(item.percentile)}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  +{formatCurrency(item.transaction.amount)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
