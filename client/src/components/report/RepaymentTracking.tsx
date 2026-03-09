/**
 * 还款追踪展示
 * 设计：极简数据叙事 - 清晰的还款来源追踪
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RepaymentRecord } from '@/lib/analyzer';
import { ChevronDown, Wallet, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  records: RepaymentRecord[];
}

export default function RepaymentTracking({ records }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // 只显示规律还款
  const meaningfulRecords = records.filter(r => r.isRegular && r.repayments.length >= 2);

  if (meaningfulRecords.length === 0) {
    return (
      <section className="py-12 border-t border-border">
        <div className="mb-8">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
            Repayment Tracking
          </h2>
          <h3 className="text-2xl font-bold text-foreground">还款追踪</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>未检测到明显的还款记录</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Repayment Tracking
        </h2>
        <h3 className="text-2xl font-bold text-foreground">还款追踪</h3>
        <p className="text-muted-foreground mt-1">
          追踪到 {meaningfulRecords.length} 组还款记录
        </p>
      </div>

      <div className="space-y-3">
        {meaningfulRecords.slice(0, 30).map((record, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <motion.div
              key={`${record.counterpart}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-indigo" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{record.counterpart}</span>
                      {record.isRegular && (
                        <Badge variant="outline" className="text-xs text-amber-warn border-amber-warn/20">
                          规律还款
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{record.repayments.length} 笔还款</span>
                      <span>·</span>
                      <span>{record.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold tabular-nums">{formatCurrency(record.totalRepaid)}</p>
                    <p className="text-xs text-muted-foreground">累计还款</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 p-4 space-y-4">
                      {/* 还款来源分析 */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">还款来源</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {record.sources.map((source, i) => (
                            <div key={i} className="bg-muted/30 rounded-md p-3">
                              <p className="text-sm font-medium">{source.method}</p>
                              <p className="text-lg font-bold tabular-nums mt-1">
                                {formatCurrency(source.total)}
                              </p>
                              <p className="text-xs text-muted-foreground">{source.count} 笔</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 还款明细 */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">还款明细</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-2 font-medium">日期</th>
                              <th className="text-left py-2 font-medium">来源</th>
                              <th className="text-right py-2 font-medium">金额</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.repayments.slice(0, 20).map((tx, i) => (
                              <tr key={i} className="border-t border-border/30">
                                <td className="py-2 tabular-nums">{formatDate(tx.date)}</td>
                                <td className="py-2">{tx.method}</td>
                                <td className="py-2 text-right tabular-nums font-medium">
                                  {formatCurrency(tx.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {record.repayments.length > 20 && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            仅显示前20条，共 {record.repayments.length} 条
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
