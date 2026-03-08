/**
 * 借款排查展示
 * 设计：极简数据叙事 - 重点突出风险项
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type LoanPattern } from '@/lib/analyzer';
import { ChevronDown, AlertTriangle, Shield, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  patterns: LoanPattern[];
}

const riskConfig = {
  low: { icon: Shield, color: 'text-emerald-ok', bg: 'bg-emerald-ok/10', border: 'border-emerald-ok/20', label: '低风险' },
  medium: { icon: AlertTriangle, color: 'text-amber-warn', bg: 'bg-amber-warn/10', border: 'border-amber-warn/20', label: '中风险' },
  high: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', label: '高风险' },
};

export default function LoanDetection({ patterns }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (patterns.length === 0) {
    return (
      <section className="py-12 border-t border-border">
        <div className="mb-8">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
            Loan Detection
          </h2>
          <h3 className="text-2xl font-bold text-foreground">借款排查</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>未检测到明显的借款模式</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Loan Detection
        </h2>
        <h3 className="text-2xl font-bold text-foreground">借款排查</h3>
        <p className="text-muted-foreground mt-1">
          检测到 {patterns.length} 组疑似借款模式
        </p>
      </div>

      {/* 风险摘要 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(['high', 'medium', 'low'] as const).map(level => {
          const count = patterns.filter(p => p.riskLevel === level).length;
          const config = riskConfig[level];
          return (
            <div key={level} className={`border rounded-lg p-4 ${config.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <config.icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {patterns.map((pattern, index) => {
          const risk = riskConfig[pattern.riskLevel];
          const isExpanded = expandedIndex === index;
          const repaymentPercent = pattern.borrowedAmount > 0 
            ? Math.min((pattern.repaidAmount / pattern.borrowedAmount) * 100, 100) 
            : 0;

          return (
            <motion.div
              key={`${pattern.counterpart}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`border rounded-lg overflow-hidden ${risk.border}`}
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full p-5 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${risk.bg}`}>
                      <risk.icon className={`w-5 h-5 ${risk.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{pattern.counterpart}</span>
                        <Badge variant="outline" className={`text-xs ${risk.color} ${risk.border}`}>
                          {risk.label}
                        </Badge>
                        {pattern.isRegularRepayment && (
                          <Badge variant="secondary" className="text-xs">
                            {pattern.repaymentSchedule}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        借入 {pattern.borrowTransactions.length} 笔 · 
                        还款 {pattern.repayTransactions.length} 笔 · 
                        还款周期: {pattern.repaymentSchedule}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform shrink-0 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>

                {/* 借还款进度 */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">借入总额</p>
                      <p className="text-lg font-bold tabular-nums text-destructive">
                        {formatCurrency(pattern.borrowedAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">已还总额</p>
                      <p className="text-lg font-bold tabular-nums text-emerald-ok">
                        {formatCurrency(pattern.repaidAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {pattern.remainingAmount >= 0 ? '未还余额' : '多还金额'}
                      </p>
                      <p className={`text-lg font-bold tabular-nums ${
                        pattern.remainingAmount > 0 ? 'text-amber-warn' : 'text-emerald-ok'
                      }`}>
                        {formatCurrency(Math.abs(pattern.remainingAmount))}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={repaymentPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      还款进度 {repaymentPercent.toFixed(1)}%
                    </p>
                  </div>
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
                    <div className="border-t border-border/50 p-4 space-y-6">
                      {/* 借入明细 */}
                      <div>
                        <h4 className="text-sm font-medium text-destructive mb-3">借入记录</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-2 font-medium">日期</th>
                              <th className="text-left py-2 font-medium">类型</th>
                              <th className="text-right py-2 font-medium">金额</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pattern.borrowTransactions.map((tx, i) => (
                              <tr key={i} className="border-t border-border/30">
                                <td className="py-2 tabular-nums">{formatDate(tx.date)}</td>
                                <td className="py-2">{tx.type}</td>
                                <td className="py-2 text-right tabular-nums font-medium text-destructive">
                                  {formatCurrency(tx.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 还款明细 */}
                      <div>
                        <h4 className="text-sm font-medium text-emerald-ok mb-3">还款记录</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-2 font-medium">日期</th>
                              <th className="text-left py-2 font-medium">方式</th>
                              <th className="text-right py-2 font-medium">金额</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pattern.repayTransactions.slice(0, 20).map((tx, i) => (
                              <tr key={i} className="border-t border-border/30">
                                <td className="py-2 tabular-nums">{formatDate(tx.date)}</td>
                                <td className="py-2">{tx.method}</td>
                                <td className="py-2 text-right tabular-nums font-medium text-emerald-ok">
                                  {formatCurrency(tx.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {pattern.repayTransactions.length > 20 && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            仅显示前20条，共 {pattern.repayTransactions.length} 条
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
