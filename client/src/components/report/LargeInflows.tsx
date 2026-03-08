/**
 * 大额入账监控
 * 设计：极简数据叙事 - 醒目的大额标记
 */

import { motion } from 'framer-motion';
import { formatCurrency, formatDate, type LargeInflow } from '@/lib/analyzer';
import { ArrowDownLeft, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  inflows: LargeInflow[];
}

export default function LargeInflows({ inflows }: Props) {
  if (inflows.length === 0) {
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
          检测到 {inflows.length} 笔大额入账
        </p>
      </div>

      <div className="space-y-4">
        {inflows.map((item, index) => (
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
    </motion.section>
  );
}
