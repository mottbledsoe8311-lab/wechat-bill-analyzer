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

  const filteredInflows = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (timeRange === '1month')  start.setMonth(start.getMonth() - 1);
    else if (timeRange === '3months') start.setMonth(start.getMonth() - 3);
    else if (timeRange === '6months') start.setMonth(start.getMonth() - 6);
    else start.setFullYear(1970);

    return inflows
      .filter(item => {
        const d = item.transaction.date;
        return d >= start && d <= end;
      })
      .sort((a, b) => b.transaction.date.getTime() - a.transaction.date.getTime());
  }, [inflows, timeRange]);

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
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>时间范围</span>
        </div>
        <div className="flex gap-1 bg-muted/60 rounded-lg p-1">
          {TIME_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeRange === opt.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredInflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">该时间范围内未检测到大额入账</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInflows.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index }}
              className={`rounded-xl border p-4 ${
                item.isUnusual
                  ? 'border-amber-warn/30 bg-amber-warn/5'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.isUnusual ? 'bg-amber-warn/15' : 'bg-emerald-ok/10'
                  }`}>
                    <ArrowDownLeft className={`w-4.5 h-4.5 ${item.isUnusual ? 'text-amber-warn' : 'text-emerald-ok'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{item.transaction.counterpart || '未知来源'}</span>
                      {item.isUnusual && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-amber-warn border-amber-warn/30">
                          <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                          异常金额
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="tabular-nums">{formatDate(item.transaction.date)}</span>
                      <span>·</span>
                      <span>{item.transaction.type}</span>
                      <span>·</span>
                      <span>{item.transaction.method}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      位于所有收入的 Top {(100 - item.percentile).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold tabular-nums text-emerald-ok leading-none">
                    +{formatCurrency(item.transaction.amount)}
                  </p>
                </div>
              </div>

              {item.relatedOutflows.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    入账后续 {item.relatedOutflows.length} 笔交易
                  </p>
                  <div className="space-y-1">
                    {item.relatedOutflows.map((tx, i) => {
                      const isIncome = tx.direction === '收入' || tx.direction === '收';
                      return (
                        <div key={i} className="flex justify-between items-center text-xs gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`shrink-0 text-[10px] px-1 py-0.5 rounded font-medium ${
                              isIncome ? 'bg-emerald-ok/10 text-emerald-ok' : 'bg-destructive/10 text-destructive'
                            }`}>
                              {isIncome ? '收' : '支'}
                            </span>
                            <span className="text-muted-foreground break-words">
                              {formatDate(tx.date)} · {tx.counterpart || '未知'}
                            </span>
                          </div>
                          <span className={`tabular-nums font-semibold shrink-0 ${
                            isIncome ? 'text-emerald-ok' : 'text-destructive'
                          }`}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
