/**
 * 规律转账识别展示
 * 设计：极简数据叙事 - 风险等级色彩编码
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RegularTransferGroup } from '@/lib/analyzer';
import { ChevronDown, Clock, AlertTriangle, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// 私贷客户推算接口
interface PrivateLoanEstimate {
  minAmount: number;      // 最小借款金额
  maxAmount: number;      // 最大借款金额
  repaymentPeriods: number[]; // 可能的还款期数
  estimatedRate: string;  // 利率范围
}

// 计算私贷客户的借款推算
function estimatePrivateLoan(avgAmount: number, transactionCount: number): PrivateLoanEstimate {
  // 交易次数 + 1 = 还款期数
  const periods = [transactionCount + 1];
  
  // 假设每期还款额 = 借款金额 * (10% + 利息)
  // 利息 = 借款金额 * (3.5% ~ 7%)
  // 推算：avgAmount = 借款金额 * (10% + 利息率)
  
  const estimates = [];
  
  // 尝试不同的利率范围
  for (let rate = 0.035; rate <= 0.07; rate += 0.005) {
    const repaymentRate = 0.1 + rate; // 10% + 利息
    const estimatedAmount = Math.round(avgAmount / repaymentRate / 100) * 100;
    estimates.push({
      amount: estimatedAmount,
      rate: (rate * 100).toFixed(1),
    });
  }
  
  // 取中位数
  const minAmount = Math.min(...estimates.map(e => e.amount));
  const maxAmount = Math.max(...estimates.map(e => e.amount));
  
  return {
    minAmount,
    maxAmount,
    repaymentPeriods: periods,
    estimatedRate: `3.5% ~ 7%`,
  };
}

interface Props {
  groups: RegularTransferGroup[];
}

const riskColors = {
  low: { bg: 'bg-emerald-ok/10', text: 'text-emerald-ok', border: 'border-emerald-ok/20', label: '低风险' },
  medium: { bg: 'bg-amber-warn/10', text: 'text-amber-warn', border: 'border-amber-warn/20', label: '中风险' },
  high: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: '高风险' },
};

export default function RegularTransfers({ groups }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // 分离私贷客户（置信度100%）和其他规律转账
  const privateLoanCustomers = groups.filter(g => g.confidence === 1.0 && (g.riskLevel === 'medium' || g.riskLevel === 'high'));
  const otherRegularTransfers = groups.filter(g => g.confidence < 1.0 && (g.riskLevel === 'medium' || g.riskLevel === 'high'));
  const filteredGroups = [...privateLoanCustomers, ...otherRegularTransfers];

  if (filteredGroups.length === 0) {
    return (
      <section className="py-12 border-t border-border">
        <div className="mb-8">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
            Regular Transfers
          </h2>
          <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Repeat className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>未检测到明显的规律转账模式</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Regular Transfers
        </h2>
        <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
        <p className="text-muted-foreground mt-1">
          检测到 {filteredGroups.length} 个中/高风险转账
        </p>
      </div>

      <div className="space-y-3">
        {filteredGroups.map((group, index) => {
          const risk = riskColors[group.riskLevel];
          const isExpanded = expandedIndex === index;

          return (
            <motion.div
              key={`${group.counterpart}-${group.direction}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`border rounded-lg overflow-hidden ${risk.border}`}
            >
              {/* 摘要行 */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${risk.bg}`}>
                    {group.riskLevel === 'high' ? (
                      <AlertTriangle className={`w-5 h-5 ${risk.text}`} />
                    ) : (
                      <Clock className={`w-5 h-5 ${risk.text}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{group.counterpart}</span>
                      <Badge variant="outline" className={`text-xs ${risk.text} ${risk.border}`}>
                        {risk.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {group.direction === '支出' || group.direction === '支' ? '转出' : '转入'}
                      </Badge>
                      {group.confidence === 1.0 && (
                        <Badge className="text-xs bg-red-600 text-white hover:bg-red-700">
                          🚨 重点核实
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3.5 h-3.5" />
                        {group.pattern}
                      </span>
                      <span>·</span>
                      <span>{group.transactions.length} 笔</span>
                      <span>·</span>
                      <span>置信度 {(group.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold tabular-nums">{formatCurrency(group.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      均 {formatCurrency(group.avgAmount)}/笔
                    </p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {/* 展开详情 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left py-2 font-medium">日期</th>
                            <th className="text-left py-2 font-medium">类型</th>
                            <th className="text-left py-2 font-medium">方式</th>
                            <th className="text-right py-2 font-medium">金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.transactions.slice(0, 20).map((tx, i) => (
                            <tr key={i} className="border-t border-border/30">
                              <td className="py-2 tabular-nums">{formatDate(tx.date)}</td>
                              <td className="py-2">{tx.type}</td>
                              <td className="py-2">{tx.method}</td>
                              <td className="py-2 text-right tabular-nums font-medium">
                                {formatCurrency(tx.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {group.transactions.length > 20 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          仅显示前20条，共 {group.transactions.length} 条记录
                        </p>
                      )}
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
