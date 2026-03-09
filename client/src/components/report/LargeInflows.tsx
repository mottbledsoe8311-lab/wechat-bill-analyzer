/**
 * 大额入账监控
 * 设计：极简数据叙事 - 醒目的大额标记
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate, type LargeInflow } from '@/lib/analyzer';
import { ArrowDownLeft, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  inflows: LargeInflow[];
}

type TimeRange = '1month' | '3months' | '6months' | 'all';

export default function LargeInflows({ inflows }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3months');

  // 计算时间范围
  const getDateRange = (range: TimeRange): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '1month':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(start.getMonth() - 6);
        break;
      case 'all':
        start.setFullYear(1970);
        break;
    }
    
    return { start, end };
  };

  // 根据时间范围筛选和排序
  const filteredInflows = useMemo(() => {
    const { start, end } = getDateRange(timeRange);
    
    return inflows
      .filter(item => {
        const itemDate = item.transaction.date;
        return itemDate >= start && itemDate <= end;
      })
      .sort((a, b) => b.transaction.date.getTime() - a.transaction.date.getTime());
  }, [inflows, timeRange]);
  if (filteredInflows.length === 0 && inflows.length === 0) {
    return (
      <section className="py-12 border-t border-border">
        <div className="mb-8">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
            Large Inflows
          </h2>
          <h3 className="text-2xl font-bold text-foreground">大额入账监控</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>未检测到大额入账记录</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Large Inflows
        </h2>
        <h3 className="text-2xl font-bold text-foreground">大额入账监控</h3>
        <p className="text-muted-foreground mt-1">
          检测到 {filteredInflows.length} 笔大额入账
        </p>
      </div>

      {/* 时间范围选择器 */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
          <Calendar className="w-4 h-4" />
          <span>时间范围：</span>
        </div>
        <Button
          variant={timeRange === '1month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('1month')}
          className="text-xs"
        >
          最近1个月
        </Button>
        <Button
          variant={timeRange === '3months' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('3months')}
          className="text-xs"
        >
          最近3个月
        </Button>
        <Button
          variant={timeRange === '6months' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('6months')}
          className="text-xs"
        >
          最近6个月
        </Button>
        <Button
          variant={timeRange === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('all')}
          className="text-xs"
        >
          全部
        </Button>
      </div>

      {filteredInflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>该时间范围内未检测到大额入账记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInflows.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className={`border rounded-lg p-5 ${
              item.isUnusual 
                ? 'border-amber-warn/30 bg-amber-warn/5' 
                : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  item.isUnusual ? 'bg-amber-warn/10' : 'bg-emerald-ok/10'
                }`}>
                  <ArrowDownLeft className={`w-5 h-5 ${
                    item.isUnusual ? 'text-amber-warn' : 'text-emerald-ok'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">
                      {item.transaction.counterpart || '未知来源'}
                    </span>
                    {item.isUnusual && (
                      <Badge variant="outline" className="text-xs text-amber-warn border-amber-warn/20">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        异常金额
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="tabular-nums">{formatDate(item.transaction.date)}</span>
                    <span>·</span>
                    <span>{item.transaction.type}</span>
                    <span>·</span>
                    <span>{item.transaction.method}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    位于所有收入的 Top {(100 - item.percentile).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-emerald-ok">
                  +{formatCurrency(item.transaction.amount)}
                </p>
              </div>
            </div>

            {/* 关联支出 */}
            {item.relatedOutflows.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  入账后的后续交易（最多10笔）
                </p>
                <div className="space-y-1">
                  {item.relatedOutflows.slice(0, 10).map((tx, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatDate(tx.date)} · {tx.counterpart}
                      </span>
                      <span className="tabular-nums text-destructive font-medium">
                        -{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
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
